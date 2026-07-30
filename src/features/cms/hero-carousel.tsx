"use client";

/**
 * Carrusel del HERO_BANNER cuando hay 2+ banners activos consecutivos.
 *
 * Implementación nativa sin librerías: track flex con `translateX` por
 * índice + autoplay con `setInterval` que se pausa al hover. Flechas
 * laterales y dots abajo. El primer slide carga con `priority` para no
 * romper el LCP.
 *
 * Loop infinito: al pasar del último vuelve al primero. Si recibe un
 * único slide, no se renderizan controles ni autoplay.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/core/lib/utils";
import type { HeroBannerData } from "@/core/modules/cms";
import { StoreImage } from "@/core/ui/store-image";

interface HeroCarouselProps {
  slides: HeroBannerData[];
  autoplayMs?: number;
}

export function HeroCarousel({ slides, autoplayMs = 5000 }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = slides.length;

  useEffect(() => {
    if (paused || total <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, autoplayMs);
    return () => clearInterval(id);
  }, [paused, total, autoplayMs]);

  function goTo(target: number) {
    setIndex(((target % total) + total) % total);
  }

  return (
    <section className="mx-auto mt-4 max-w-7xl px-4">
      <div
        className="relative overflow-hidden rounded-lg bg-muted shadow-sm"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        aria-roledescription="carousel"
        aria-label="Banners destacados"
      >
        <div
          className="flex aspect-21/6 transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, i) => {
            const altText = slide.imageAlt || slide.heading || "";
            const image = (
              <StoreImage
                src={slide.imagePublicId}
                alt={altText}
                preset="banner"
                priority={i === 0}
              />
            );
            return (
              <div
                key={i}
                className="relative size-full shrink-0 basis-full"
                aria-roledescription="slide"
                aria-label={`Banner ${i + 1} de ${total}`}
                aria-hidden={i !== index}
              >
                {slide.ctaHref ? (
                  <Link
                    href={slide.ctaHref}
                    aria-label={slide.ctaLabel || slide.heading || `Banner ${i + 1}`}
                    className="block size-full"
                    tabIndex={i === index ? 0 : -1}
                  >
                    {image}
                  </Link>
                ) : (
                  image
                )}
              </div>
            );
          })}
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Banner anterior"
              className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm transition-colors hover:bg-background sm:left-4 sm:size-10"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Banner siguiente"
              className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm transition-colors hover:bg-background sm:right-4 sm:size-10"
            >
              <ChevronRightIcon className="size-5" />
            </button>

            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Ir al banner ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i === index
                      ? "w-6 bg-foreground"
                      : "w-2 bg-foreground/40 hover:bg-foreground/60",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
