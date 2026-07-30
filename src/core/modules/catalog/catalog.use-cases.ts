/**
 * Use cases del catálogo — la lógica que consume el storefront.
 *
 * Orquestan: validan el input (Zod), resuelven reglas de negocio
 * (jerarquía de categorías, paginación) y delegan el acceso a datos
 * en el repositorio. No tocan Prisma directamente.
 */
import * as repo from "./catalog.repository";
import { listProductsInputSchema } from "./catalog.schemas";
import type {
  Category,
  CategoryDetail,
  CategorySummary,
  CategoryTreeNode,
  ProductDetail,
  ProductListItem,
  ProductListResult,
} from "./catalog.types";

// ─── Helpers de categorías ─────────────────────────────────────

function toSummary(c: Category): CategorySummary {
  return { id: c.id, name: c.name, slug: c.slug };
}

/** Arma el árbol jerárquico a partir de la lista plana de categorías. */
function buildTree(categories: Category[]): CategoryTreeNode[] {
  const nodes = new Map<string, CategoryTreeNode>();
  for (const c of categories) {
    nodes.set(c.id, {
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
      icon: c.icon,
      children: [],
    });
  }
  const roots: CategoryTreeNode[] = [];
  for (const c of categories) {
    const node = nodes.get(c.id)!;
    const parent = c.parentId ? nodes.get(c.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/** Ruta de ancestros (incluida la categoría) — orden raíz → hoja. */
function buildBreadcrumb(
  categories: Category[],
  target: Category,
): CategorySummary[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const trail: CategorySummary[] = [];
  let current: Category | undefined = target;
  // Cota de seguridad por si hubiera un ciclo de datos.
  for (let guard = 0; current && guard < 50; guard++) {
    trail.unshift(toSummary(current));
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return trail;
}

/** IDs de una categoría (por slug) más todas sus descendientes. */
function collectCategoryAndDescendants(
  categories: Category[],
  slug: string,
): string[] {
  const root = categories.find((c) => c.slug === slug);
  if (!root) return [];
  const ids = [root.id];
  const queue = [root.id];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    for (const c of categories) {
      if (c.parentId === currentId) {
        ids.push(c.id);
        queue.push(c.id);
      }
    }
  }
  return ids;
}

// ─── Use cases ─────────────────────────────────────────────────

/** Producto publicado por slug. `null` ⇒ la página debe hacer notFound(). */
export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  const clean = slug.trim();
  if (!clean) return null;
  return repo.findProductBySlug(clean);
}

/**
 * Listado paginado de productos. Acepta los `searchParams` crudos:
 * el schema es tolerante, así que valores inválidos caen a defaults.
 */
export async function listProducts(
  rawInput: unknown,
): Promise<ProductListResult> {
  const input = listProductsInputSchema.parse(rawInput ?? {});

  let categoryIds: string[] | undefined;
  if (input.category) {
    const categories = await repo.findActiveCategories();
    categoryIds = collectCategoryAndDescendants(categories, input.category);
    // Categoría inexistente → resultado vacío, sin tocar la base.
    if (categoryIds.length === 0) {
      return {
        items: [],
        total: 0,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: 1,
      };
    }
  }

  const { items, total } = await repo.findProducts({
    categoryIds,
    search: input.q,
    inStockOnly: input.inStockOnly,
    sort: input.sort,
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
  });

  return {
    items,
    total,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
  };
}

/** Árbol completo de categorías activas — para la navegación. */
export async function getCategoryTree(): Promise<CategoryTreeNode[]> {
  const categories = await repo.findActiveCategories();
  return buildTree(categories);
}

/** Slugs de productos publicados — sitemap y generación estática (M1.6). */
export async function listProductSlugs(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  return repo.findProductSlugs();
}

/**
 * Productos relacionados — para el carrusel "Te puede interesar" de la
 * PDP. Filtra por la categoría dada (o sus descendientes) y excluye el
 * producto actual. Si no hay categoría o no hay resultados, devuelve `[]`
 * y el componente decide no renderizar nada.
 */
export async function listRelatedProducts(params: {
  excludeProductId: string;
  categorySlug?: string | null;
  limit?: number;
}): Promise<ProductListItem[]> {
  const limit = params.limit ?? 8;

  let categoryIds: string[] | undefined;
  if (params.categorySlug) {
    const categories = await repo.findActiveCategories();
    categoryIds = collectCategoryAndDescendants(categories, params.categorySlug);
    if (categoryIds.length === 0) return [];
  }

  const { items } = await repo.findProducts({
    categoryIds,
    excludeProductId: params.excludeProductId,
    inStockOnly: false,
    sort: "newest",
    skip: 0,
    take: limit,
  });
  return items;
}

/** % de descuento basado en el precio mínimo y el `compareAtPrice`. */
function offerDiscountPercent(product: {
  priceRange: { min: number };
  compareAtPrice: number | null;
}): number {
  if (!product.compareAtPrice || product.compareAtPrice <= product.priceRange.min) {
    return 0;
  }
  return (
    ((product.compareAtPrice - product.priceRange.min) / product.compareAtPrice) *
    100
  );
}

/**
 * Productos en oferta, ordenados de mayor a menor % de descuento.
 *
 * Sin paginar — el ordenamiento por % se hace en memoria porque Prisma
 * no permite comparar dos columnas en `orderBy`. Funciona bien hasta
 * algunos cientos de productos en oferta; para tiendas más grandes
 * conviene migrar a raw SQL.
 *
 * `limit` opcional para los carruseles (top N ofertas) — se aplica DESPUÉS
 * de ordenar, así el carrusel siempre muestra las mejores promos.
 */
export async function listOffers(limit?: number): Promise<ProductListItem[]> {
  const { items } = await repo.findProducts({
    onSaleOnly: true,
    inStockOnly: false,
    sort: "newest",
    skip: 0,
    take: 500,
  });
  // Filtro fino: el query trae los que tienen compareAtPrice cargado;
  // acá filtramos los que efectivamente tienen descuento (compareAt > price).
  const onlyWithDiscount = items.filter(
    (product) => offerDiscountPercent(product) > 0,
  );
  onlyWithDiscount.sort(
    (a, b) => offerDiscountPercent(b) - offerDiscountPercent(a),
  );
  return typeof limit === "number" ? onlyWithDiscount.slice(0, limit) : onlyWithDiscount;
}

/** Categoría por slug con breadcrumb e hijas directas. `null` ⇒ notFound(). */
export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryDetail | null> {
  const clean = slug.trim();
  if (!clean) return null;

  const categories = await repo.findActiveCategories();
  const target = categories.find((c) => c.slug === clean);
  if (!target) return null;

  return {
    id: target.id,
    name: target.name,
    slug: target.slug,
    description: target.description,
    imageUrl: target.imageUrl,
    icon: target.icon,
    breadcrumb: buildBreadcrumb(categories, target),
    children: categories
      .filter((c) => c.parentId === target.id)
      .map(toSummary),
  };
}
