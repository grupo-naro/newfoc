/**
 * /ofertas — listado de productos con descuento.
 *
 * Trae todas las ofertas en una sola consulta (sin paginar) y las
 * muestra ordenadas por mayor % de descuento. Si en el futuro hay
 * cientos de ofertas y se necesita paginar, conviene migrar a raw SQL
 * (Prisma no permite orderBy con expresiones de varias columnas).
 */
import type { Metadata } from "next";
import Link from "next/link";

import { cn } from "@/core/lib/utils";
import { listOffers } from "@/core/modules/catalog";
import { buttonVariants } from "@/core/ui/button";
import { ProductCard } from "@/core/ui/commerce";

export const metadata: Metadata = {
  title: "Ofertas",
  description: "Productos con descuento — los mejores precios de la tienda.",
  alternates: { canonical: "/ofertas" },
};

export default async function OfertasPage() {
  const offers = await listOffers();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold uppercase tracking-tight">Ofertas</h1>
        <div className="h-1 w-12 rounded-full bg-[oklch(0.5_0.22_260)]" />
        <p className="mt-2 text-sm text-muted-foreground">
          {offers.length === 0
            ? "Por ahora no hay productos en oferta — volvé pronto."
            : `${offers.length} ${offers.length === 1 ? "producto" : "productos"} con descuento, ordenados por mayor rebaja.`}
        </p>
      </div>

      {offers.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <Link
            href="/productos"
            className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
          >
            Ver todos los productos
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {offers.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 4}
            />
          ))}
        </div>
      )}
    </div>
  );
}
