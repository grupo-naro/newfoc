/**
 * Renderer dinámico de la home — mapea cada bloque del CMS a su
 * componente según el tipo. Sumar un tipo nuevo = un `case` más.
 *
 * Caso especial: HERO_BANNER consecutivos se agrupan en un solo
 * `<HeroCarousel>` con autoplay + flechas + dots. Esto permite que el
 * admin cargue varios banners y se roten automáticamente, sin perder
 * la posibilidad de tener heroes "sueltos" (un solo banner se renderiza
 * con `<HeroBannerBlock>` plano, sin controles).
 */
import type { HomeBlock } from "@/core/modules/cms";

import { CategoryGridBlock } from "./category-grid-block";
import { HeroBannerBlock } from "./hero-banner-block";
import { HeroCarousel } from "./hero-carousel";
import { OffersCarouselBlock } from "./offers-carousel-block";
import { ProductCarouselBlock } from "./product-carousel-block";

type HeroBlock = Extract<HomeBlock, { type: "HERO_BANNER" }>;
type HomeBlockGroup =
  | { kind: "single"; block: HomeBlock }
  | { kind: "hero-run"; blocks: HeroBlock[] };

/** Colapsa runs de HERO_BANNER consecutivos en un solo grupo. */
function groupBlocks(blocks: HomeBlock[]): HomeBlockGroup[] {
  const groups: HomeBlockGroup[] = [];
  let currentRun: HeroBlock[] | null = null;
  for (const block of blocks) {
    if (block.type === "HERO_BANNER") {
      if (currentRun) {
        currentRun.push(block);
      } else {
        currentRun = [block];
        groups.push({ kind: "hero-run", blocks: currentRun });
      }
    } else {
      currentRun = null;
      groups.push({ kind: "single", block });
    }
  }
  return groups;
}

export function HomeBlocks({ blocks }: { blocks: HomeBlock[] }) {
  const groups = groupBlocks(blocks);

  return (
    <>
      {groups.map((group, groupIndex) => {
        if (group.kind === "hero-run") {
          if (group.blocks.length === 1) {
            const only = group.blocks[0];
            return <HeroBannerBlock key={only.id} data={only.data} />;
          }
          return (
            <HeroCarousel
              key={`hero-carousel-${groupIndex}`}
              slides={group.blocks.map((b) => b.data)}
            />
          );
        }

        const { block } = group;
        switch (block.type) {
          case "PRODUCT_CAROUSEL":
            return <ProductCarouselBlock key={block.id} data={block.data} />;
          case "CATEGORY_GRID":
            return <CategoryGridBlock key={block.id} data={block.data} />;
          case "OFFERS_CAROUSEL":
            return <OffersCarouselBlock key={block.id} data={block.data} />;
          case "ANNOUNCEMENT_BAR":
            // Se renderiza en el layout, no acá. `getHomeBlocks` ya lo
            // filtra del listado de la home — este case es solo para
            // que TypeScript vea la unión completa.
            return null;
          case "HERO_BANNER":
            // Inalcanzable: los HERO_BANNER caen en hero-run arriba.
            return null;
        }
      })}
    </>
  );
}
