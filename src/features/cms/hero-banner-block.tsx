/**
 * Bloque "Banner principal" — imagen apaisada contenida.
 *
 * El admin sube una imagen 21:6 que ya trae el texto/CTA quemado adentro,
 * así que el render no superpone overlay. Si cargó `ctaHref`, toda la
 * imagen es clickeable hacia ese link.
 *
 * No ocupa todo el viewport: vive dentro del `max-w-7xl` con padding
 * lateral, redondeada y con un margen superior — mismo "framing" que
 * el resto de los bloques de la home.
 */
import Link from "next/link";

import type { HeroBannerData } from "@/core/modules/cms";
import { StoreImage } from "@/core/ui/store-image";

export function HeroBannerBlock({ data }: { data: HeroBannerData }) {
  const banner = (
    <div className="relative aspect-21/6 w-full overflow-hidden rounded-lg bg-muted shadow-sm">
      <StoreImage
        src={data.imagePublicId}
        alt={data.imageAlt || data.heading || ""}
        preset="banner"
        priority
      />
    </div>
  );

  return (
    <section className="mx-auto mt-4 max-w-7xl px-4">
      {data.ctaHref ? (
        <Link
          href={data.ctaHref}
          aria-label={data.ctaLabel || data.heading || "Banner"}
          className="block"
        >
          {banner}
        </Link>
      ) : (
        banner
      )}
    </section>
  );
}
