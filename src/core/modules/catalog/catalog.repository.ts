/**
 * Repositorio del catálogo — única capa que habla con Prisma.
 *
 * Recibe criterios simples y devuelve SIEMPRE tipos de dominio
 * (catalog.types). Los use cases no ven Prisma. Sólo expone datos
 * de productos `ACTIVE` y variantes activas: es la cara pública
 * del catálogo (storefront). El admin tendrá su propio acceso.
 */
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/core/lib/db";

import type {
  Category,
  PriceRange,
  ProductDetail,
  ProductListItem,
} from "./catalog.types";
import type { ProductSort } from "./catalog.schemas";

// ─── Selects de Prisma ─────────────────────────────────────────

const productListSelect = {
  id: true,
  name: true,
  slug: true,
  createdAt: true,
  images: {
    orderBy: { sortOrder: "asc" },
    take: 1,
    select: { publicId: true, alt: true },
  },
  categories: {
    select: { category: { select: { id: true, name: true, slug: true } } },
  },
  variants: {
    where: { isActive: true },
    orderBy: { price: "asc" },
    select: { id: true, price: true, compareAtPrice: true, stock: true },
  },
} satisfies Prisma.ProductSelect;

const productDetailSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  metaTitle: true,
  metaDescription: true,
  images: {
    orderBy: { sortOrder: "asc" },
    select: { publicId: true, alt: true },
  },
  categories: {
    select: { category: { select: { id: true, name: true, slug: true } } },
  },
  options: {
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      values: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, value: true },
      },
    },
  },
  variants: {
    where: { isActive: true },
    orderBy: { price: "asc" },
    select: {
      id: true,
      sku: true,
      name: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      optionValues: { select: { optionValueId: true } },
    },
  },
} satisfies Prisma.ProductSelect;

type ProductListRow = Prisma.ProductGetPayload<{
  select: typeof productListSelect;
}>;
type ProductDetailRow = Prisma.ProductGetPayload<{
  select: typeof productDetailSelect;
}>;

const PRODUCT_ORDER_BY: Record<
  ProductSort,
  Prisma.ProductOrderByWithRelationInput
> = {
  newest: { createdAt: "desc" },
  name: { name: "asc" },
};

// ─── Mappers (fila Prisma → tipo de dominio) ───────────────────

type VariantPriceInfo = { price: number; compareAtPrice: number | null; stock: number };

/** Deriva rango de precios, descuento y disponibilidad de las variantes. */
function priceInfoFromVariants(variants: VariantPriceInfo[]): {
  priceRange: PriceRange;
  compareAtPrice: number | null;
  inStock: boolean;
} {
  if (variants.length === 0) {
    return { priceRange: { min: 0, max: 0 }, compareAtPrice: null, inStock: false };
  }
  const prices = variants.map((v) => v.price);
  const cheapest = variants.reduce((a, b) => (b.price < a.price ? b : a));
  const hasDiscount =
    cheapest.compareAtPrice !== null && cheapest.compareAtPrice > cheapest.price;
  return {
    priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
    compareAtPrice: hasDiscount ? cheapest.compareAtPrice : null,
    inStock: variants.some((v) => v.stock > 0),
  };
}

function toProductListItem(row: ProductListRow): ProductListItem {
  const { priceRange, compareAtPrice, inStock } = priceInfoFromVariants(
    row.variants,
  );
  const image = row.images[0] ?? null;
  // Quick-add desde la card: primera variante en stock; si todas están
  // sin stock, la más barata (queda disabled en el botón igual).
  const defaultVariant =
    row.variants.find((v) => v.stock > 0) ?? row.variants[0] ?? null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    image: image ? { publicId: image.publicId, alt: image.alt } : null,
    priceRange,
    compareAtPrice,
    inStock,
    categories: row.categories.map((c) => c.category),
    defaultVariantId: defaultVariant?.id ?? null,
  };
}

function toProductDetail(row: ProductDetailRow): ProductDetail {
  const { priceRange, inStock } = priceInfoFromVariants(row.variants);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    images: row.images.map((i) => ({ publicId: i.publicId, alt: i.alt })),
    categories: row.categories.map((c) => c.category),
    options: row.options.map((o) => ({
      id: o.id,
      name: o.name,
      values: o.values.map((v) => ({ id: v.id, value: v.value })),
    })),
    variants: row.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      stock: v.stock,
      inStock: v.stock > 0,
      optionValueIds: v.optionValues.map((ov) => ov.optionValueId),
    })),
    priceRange,
    inStock,
  };
}

// ─── Queries ───────────────────────────────────────────────────

/** Producto publicado por slug, con todo lo necesario para la PDP. */
export async function findProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  const row = await prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    select: productDetailSelect,
  });
  return row ? toProductDetail(row) : null;
}

export interface FindProductsCriteria {
  /** IDs de categorías a incluir (la categoría pedida + sus descendientes). */
  categoryIds?: string[];
  /** ID de producto a EXCLUIR del resultado (para "productos relacionados"). */
  excludeProductId?: string;
  search?: string;
  inStockOnly: boolean;
  /**
   * Si es true, sólo productos con al menos una variante activa con
   * `compareAtPrice` cargado — el proxy SQL de "está en oferta". El
   * filtro fino (`compareAtPrice > price`) se hace en memoria con el
   * mapper, así que un compareAt mal cargado (≤ price) entra al query
   * pero queda con `compareAtPrice: null` y el front no lo ve como oferta.
   */
  onSaleOnly?: boolean;
  sort: ProductSort;
  skip: number;
  take: number;
}

/** Listado paginado de productos publicados + total que matchea el filtro. */
export async function findProducts(
  criteria: FindProductsCriteria,
): Promise<{ items: ProductListItem[]; total: number }> {
  // Cada filtro sobre `variants.some` va como una condición independiente
  // en `AND` — sino el segundo spread pisa al primero.
  const variantsConditions: Prisma.ProductWhereInput[] = [];
  if (criteria.inStockOnly) {
    variantsConditions.push({
      variants: { some: { isActive: true, stock: { gt: 0 } } },
    });
  }
  if (criteria.onSaleOnly) {
    variantsConditions.push({
      variants: { some: { isActive: true, compareAtPrice: { not: null } } },
    });
  }

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    ...(criteria.categoryIds && {
      categories: { some: { categoryId: { in: criteria.categoryIds } } },
    }),
    ...(criteria.excludeProductId && {
      id: { not: criteria.excludeProductId },
    }),
    ...(criteria.search && {
      OR: [
        { name: { contains: criteria.search, mode: "insensitive" } },
        { description: { contains: criteria.search, mode: "insensitive" } },
      ],
    }),
    ...(variantsConditions.length > 0 && { AND: variantsConditions }),
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productListSelect,
      orderBy: PRODUCT_ORDER_BY[criteria.sort],
      skip: criteria.skip,
      take: criteria.take,
    }),
    prisma.product.count({ where }),
  ]);

  return { items: rows.map(toProductListItem), total };
}

/** Todas las categorías activas, planas (la jerarquía se arma en el use case). */
export async function findActiveCategories(): Promise<Category[]> {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      icon: true,
      parentId: true,
    },
  });
}

/** Slugs de productos publicados — para el sitemap y generateStaticParams. */
export async function findProductSlugs(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  return prisma.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    select: { slug: true, updatedAt: true },
  });
}
