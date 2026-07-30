/**
 * Bloque "Carrusel de ofertas" — los N productos con mayor % de descuento.
 *
 * Misma estructura visual que el ProductCarouselBlock pero el listado
 * viene de `listOffers(limit)`. El link "Ver todas" apunta a /ofertas.
 */
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { listOffers } from "@/core/modules/catalog";
import type { OffersCarouselData } from "@/core/modules/cms";
import { ProductCard } from "@/core/ui/commerce";

export async function OffersCarouselBlock({
  data,
}: {
  data: OffersCarouselData;
}) {
  const items = await listOffers(data.limit);
  if (items.length === 0) return null;

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
            href="/ofertas"
            className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:underline"
          >
            Ver todas
            <ChevronRightIcon className="size-4" />
          </Link>
        </div>

        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {items.map((product) => (
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
