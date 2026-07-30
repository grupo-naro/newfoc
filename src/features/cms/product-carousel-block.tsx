/**
 * Bloque "Carrusel de productos".
 *
 * En desktop renderiza una grilla fija de 4 columnas; en mobile se
 * convierte en una tira horizontal scrolleable con snap. El link
 * "Ver todas" apunta al listado filtrado por la categoría del bloque
 * (o al listado completo cuando son "los más nuevos").
 */
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { listProducts } from "@/core/modules/catalog";
import type { ProductCarouselData } from "@/core/modules/cms";
import { ProductCard } from "@/core/ui/commerce";

export async function ProductCarouselBlock({
  data,
}: {
  data: ProductCarouselData;
}) {
  const result = await listProducts({
    category: data.categorySlug || undefined,
    pageSize: data.limit,
    sort: "newest",
  });

  if (result.items.length === 0) return null;

  const viewAllHref = data.categorySlug
    ? `/productos?category=${data.categorySlug}`
    : "/productos";

  return (
    <section className="bg-background py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex items-end justify-between gap-4">
          {data.heading ? (
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight sm:text-3xl">
                {data.heading}
              </h2>
              <div className="mt-2 h-1 w-12 rounded-full bg-[oklch(0.5_0.22_260)]" />
            </div>
          ) : (
            <span />
          )}
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:underline"
          >
            Ver todas
            <ChevronRightIcon className="size-4" />
          </Link>
        </div>

        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {result.items.map((product) => (
            <div
              key={product.id}
              className="w-60 shrink-0 snap-start sm:w-auto"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
