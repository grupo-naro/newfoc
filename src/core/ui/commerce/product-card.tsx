/**
 * ProductCard — la card de producto para grillas y listados.
 *
 * Server Component. El área de la imagen/nombre/precio es un link a la
 * PDP; el botón "Agregar al carrito" vive aparte (es un client component
 * con su propio handler) para no anidar interacciones dentro del Link.
 */
import Link from "next/link";

import { discountPercent, formatPrice } from "@/core/lib/format";
import { cn } from "@/core/lib/utils";
import type { ProductListItem } from "@/core/modules/catalog";
import { Skeleton } from "@/core/ui/skeleton";
import { StoreImage } from "@/core/ui/store-image";

import { QuickAddButton } from "./quick-add-button";

interface ProductCardProps {
  product: ProductListItem;
  className?: string;
  /**
   * Marca la imagen como `priority` (precarga + sin lazy load). Activar
   * sólo en las primeras cards del listado (LCP candidates).
   */
  priority?: boolean;
}

export function ProductCard({ product, className, priority }: ProductCardProps) {
  const { min, max } = product.priceRange;
  const isRange = min !== max;
  const discount = isRange
    ? null
    : discountPercent(min, product.compareAtPrice);
  const showCompareAt =
    !isRange &&
    product.compareAtPrice != null &&
    product.compareAtPrice > min;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <Link
        href={`/productos/${product.slug}`}
        className="flex flex-col gap-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
          {product.image ? (
            <StoreImage
              src={product.image.publicId}
              alt={product.image.alt ?? product.name}
              preset="card"
              priority={priority}
              className="transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Sin imagen
            </div>
          )}

          {discount !== null && (
            <span className="absolute right-2 top-2 rounded-md bg-[oklch(0.62_0.24_0)] px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
              {discount}% OFF
            </span>
          )}
          {!product.inStock && (
            <span className="absolute left-2 top-2 rounded-md bg-foreground/80 px-2 py-1 text-[11px] font-medium text-background">
              Sin stock
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 px-1">
          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-snug text-foreground group-hover:underline">
            {product.name}
          </h3>
          <div className="flex flex-col gap-0.5">
            {isRange ? (
              <span className="text-xs text-muted-foreground">Desde</span>
            ) : showCompareAt && product.compareAtPrice != null ? (
              <s className="text-sm text-muted-foreground tabular-nums">
                {formatPrice(product.compareAtPrice)}
              </s>
            ) : (
              <span className="text-sm text-transparent">·</span>
            )}
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {formatPrice(min)}
            </span>
          </div>
        </div>
      </Link>

      <div className="mt-3 px-1">
        <QuickAddButton
          productId={product.id}
          productName={product.name}
          variantId={product.defaultVariantId}
          unitPrice={min}
          inStock={product.inStock}
        />
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-sm">
      <Skeleton className="aspect-square w-full rounded-md" />
      <div className="flex flex-col gap-2 px-1 pt-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-6 w-1/2" />
      </div>
      <Skeleton className="mx-1 mt-2 h-11 w-[calc(100%-0.5rem)] rounded-md" />
    </div>
  );
}
