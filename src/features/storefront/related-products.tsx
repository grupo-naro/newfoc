/**
 * Carrusel "Productos relacionados" de la PDP.
 *
 * Server Component que llama al use case `listRelatedProducts` con la
 * primera categoría del producto y excluye el actual. Si no hay
 * categoría o no se encuentran relacionados, no renderiza nada.
 *
 * Mismo look que el `ProductCarouselBlock` del CMS — título uppercase
 * con subrayado azul, grid 4 col en desktop, scroll horizontal en mobile.
 */
import { listRelatedProducts } from "@/core/modules/catalog";
import { ProductCard } from "@/core/ui/commerce";

interface RelatedProductsProps {
  productId: string;
  categorySlug: string | null | undefined;
}

export async function RelatedProducts({
  productId,
  categorySlug,
}: RelatedProductsProps) {
  if (!categorySlug) return null;

  const items = await listRelatedProducts({
    excludeProductId: productId,
    categorySlug,
    limit: 8,
  });
  if (items.length === 0) return null;

  return (
    <section className="bg-muted/40 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold uppercase tracking-tight sm:text-3xl">
            Productos relacionados
          </h2>
          <div className="mt-2 h-1 w-12 rounded-full bg-[oklch(0.5_0.22_260)]" />
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
