/**
 * Seed de catálogo demo.
 *
 * Carga un catálogo chico pero representativo para desarrollar el
 * storefront (M1.4) y verificar el módulo `catalog`. Cubre los casos
 * que importan: jerarquía de categorías, productos con opciones y
 * variantes, producto simple (sin opciones), descuento, stock 0 y
 * un producto en DRAFT (que NO debe aparecer en el storefront).
 *
 * Correr con: `pnpm db:seed`. Es destructivo — borra el catálogo
 * actual antes de cargar.
 */
import "dotenv/config";

import { bootstrapSuperAdmin } from "@/core/auth/bootstrap-admin";
import { prisma } from "@/core/lib/db";

type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

interface SeedProduct {
  name: string;
  slug: string;
  description: string;
  status: ProductStatus;
  categoryIds: string[];
  images: { publicId: string; alt: string }[];
  options: { name: string; values: string[] }[];
  variants: {
    sku: string;
    name: string | null;
    price: number; // centavos
    compareAtPrice?: number;
    stock: number;
    weightGrams?: number;
    /** { "Talle": "M", "Color": "Negro" } — vacío si el producto no tiene opciones. */
    options: Record<string, string>;
  }[];
}

function img(publicId: string, alt: string) {
  return { publicId, alt };
}

async function seedProduct(input: SeedProduct) {
  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      status: input.status,
      categories: {
        create: input.categoryIds.map((categoryId) => ({ categoryId })),
      },
      images: {
        create: input.images.map((image, i) => ({
          publicId: image.publicId,
          alt: image.alt,
          sortOrder: i,
        })),
      },
      options: {
        create: input.options.map((option, oi) => ({
          name: option.name,
          sortOrder: oi,
          values: {
            create: option.values.map((value, vi) => ({ value, sortOrder: vi })),
          },
        })),
      },
    },
    include: { options: { include: { values: true } } },
  });

  // Mapa "Opción::Valor" → optionValueId, para enlazar las variantes.
  const valueId = new Map<string, string>();
  for (const option of product.options) {
    for (const value of option.values) {
      valueId.set(`${option.name}::${value.value}`, value.id);
    }
  }

  for (const variant of input.variants) {
    await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice ?? null,
        stock: variant.stock,
        weightGrams: variant.weightGrams ?? null,
        optionValues: {
          create: Object.entries(variant.options).map(([optName, val]) => {
            const id = valueId.get(`${optName}::${val}`);
            if (!id) {
              throw new Error(
                `Seed: la variante ${variant.sku} referencia ${optName}=${val}, que no existe en las opciones del producto.`,
              );
            }
            return { optionValueId: id };
          }),
        },
      },
    });
  }

  return product;
}

async function main() {
  console.log("⏳ Limpiando catálogo…");
  await prisma.product.deleteMany(); // cascadea imágenes, opciones y variantes
  await prisma.category.deleteMany();

  console.log("⏳ Creando categorías…");
  const indumentaria = await prisma.category.create({
    data: { name: "Indumentaria", slug: "indumentaria", sortOrder: 0 },
  });
  const accesorios = await prisma.category.create({
    data: { name: "Accesorios", slug: "accesorios", sortOrder: 1 },
  });
  const remeras = await prisma.category.create({
    data: {
      name: "Remeras",
      slug: "remeras",
      parentId: indumentaria.id,
      sortOrder: 0,
    },
  });
  const buzos = await prisma.category.create({
    data: {
      name: "Buzos",
      slug: "buzos",
      parentId: indumentaria.id,
      sortOrder: 1,
    },
  });

  console.log("⏳ Creando productos…");

  // 1) Producto con 2 ejes de variación (Talle × Color), con descuento
  //    y una variante sin stock.
  await seedProduct({
    name: "Remera Oversize",
    slug: "remera-oversize",
    description:
      "Remera de algodón peinado, corte oversize. Cuello reforzado y caída amplia.",
    status: "ACTIVE",
    categoryIds: [remeras.id],
    images: [
      img("cld-sample", "Remera Oversize, vista frontal"),
      img("cld-sample-2", "Remera Oversize, vista trasera"),
    ],
    options: [
      { name: "Talle", values: ["S", "M", "L"] },
      { name: "Color", values: ["Negro", "Blanco"] },
    ],
    variants: [
      { sku: "REM-OVS-NEG-S", name: "Negro / S", price: 1599900, compareAtPrice: 1999900, stock: 0, weightGrams: 220, options: { Talle: "S", Color: "Negro" } },
      { sku: "REM-OVS-NEG-M", name: "Negro / M", price: 1599900, compareAtPrice: 1999900, stock: 12, weightGrams: 230, options: { Talle: "M", Color: "Negro" } },
      { sku: "REM-OVS-NEG-L", name: "Negro / L", price: 1599900, compareAtPrice: 1999900, stock: 8, weightGrams: 240, options: { Talle: "L", Color: "Negro" } },
      { sku: "REM-OVS-BLA-S", name: "Blanco / S", price: 1599900, compareAtPrice: 1999900, stock: 5, weightGrams: 220, options: { Talle: "S", Color: "Blanco" } },
      { sku: "REM-OVS-BLA-M", name: "Blanco / M", price: 1599900, compareAtPrice: 1999900, stock: 9, weightGrams: 230, options: { Talle: "M", Color: "Blanco" } },
      { sku: "REM-OVS-BLA-L", name: "Blanco / L", price: 1599900, compareAtPrice: 1999900, stock: 3, weightGrams: 240, options: { Talle: "L", Color: "Blanco" } },
    ],
  });

  // 2) Producto con un solo eje (Talle).
  await seedProduct({
    name: "Buzo Canguro",
    slug: "buzo-canguro",
    description:
      "Buzo con capucha y bolsillo canguro. Frisa de algodón, abrigado y resistente.",
    status: "ACTIVE",
    categoryIds: [buzos.id],
    images: [img("cld-sample-3", "Buzo Canguro")],
    options: [{ name: "Talle", values: ["M", "L"] }],
    variants: [
      { sku: "BUZ-CAN-M", name: "M", price: 2999900, stock: 15, weightGrams: 520, options: { Talle: "M" } },
      { sku: "BUZ-CAN-L", name: "L", price: 2999900, stock: 7, weightGrams: 560, options: { Talle: "L" } },
    ],
  });

  // 3) Producto simple: sin opciones, una sola variante.
  await seedProduct({
    name: "Gorra Trucker",
    slug: "gorra-trucker",
    description: "Gorra trucker de frente rígido y malla trasera. Talle único regulable.",
    status: "ACTIVE",
    categoryIds: [accesorios.id],
    images: [img("cld-sample-4", "Gorra Trucker")],
    options: [],
    variants: [
      { sku: "GOR-TRU-UNI", name: null, price: 899900, stock: 30, weightGrams: 110, options: {} },
    ],
  });

  // 4) Producto en DRAFT: NO debe aparecer en el storefront.
  await seedProduct({
    name: "Remera Beta (borrador)",
    slug: "remera-beta",
    description: "Producto en borrador para verificar que el storefront filtra los DRAFT.",
    status: "DRAFT",
    categoryIds: [remeras.id],
    images: [img("cld-sample-5", "Remera Beta")],
    options: [],
    variants: [
      { sku: "REM-BETA-UNI", name: null, price: 1299900, stock: 10, options: {} },
    ],
  });

  console.log("⏳ Creando bloques de la home…");
  await prisma.homeBlock.deleteMany();
  await prisma.homeBlock.create({
    data: {
      type: "HERO_BANNER",
      sortOrder: 0,
      data: {
        imagePublicId: "cld-sample",
        imageAlt: "Banner principal de la tienda",
        heading: "Tu próxima tienda online",
        subheading: "Catálogo, variantes y stock listos para vender.",
        ctaLabel: "Ver productos",
        ctaHref: "/productos",
      },
    },
  });
  await prisma.homeBlock.create({
    data: {
      type: "CATEGORY_GRID",
      sortOrder: 1,
      data: { heading: "Categorías" },
    },
  });
  await prisma.homeBlock.create({
    data: {
      type: "PRODUCT_CAROUSEL",
      sortOrder: 2,
      data: { heading: "Destacados", categorySlug: "", limit: 8 },
    },
  });

  const [categories, products, variants, blocks] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.productVariant.count(),
    prisma.homeBlock.count(),
  ]);
  console.log(
    `✅ Seed completo: ${categories} categorías, ${products} productos, ${variants} variantes, ${blocks} bloques de home.`,
  );

  console.log("⏳ Bootstrap del superadmin…");
  await bootstrapSuperAdmin();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("❌ Seed falló:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
