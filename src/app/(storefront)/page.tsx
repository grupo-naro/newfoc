import type { Metadata } from "next";
import Link from "next/link";

import { cn } from "@/core/lib/utils";
import { getHomeBlocks } from "@/core/modules/cms";
import { buttonVariants } from "@/core/ui/button";
import { HomeBlocks } from "@/features/cms/home-blocks";
import { storeConfig } from "@/store.config";

// ISR: la home se regenera cada hora; el editor del panel (M5.2)
// además la revalida al guardar cambios.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: `${storeConfig.name} · ${storeConfig.tagline}` },
  description: storeConfig.description,
};

export default async function HomePage() {
  const blocks = await getHomeBlocks();

  // Sin bloques cargados — fallback mínimo para que la home no quede vacía.
  if (blocks.length === 0) {
    return (
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            {storeConfig.tagline}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Explorá el catálogo y encontrá lo que buscás.
          </p>
          <Link
            href="/productos"
            className={cn(buttonVariants({ size: "lg" }), "mt-8")}
          >
            Ver productos
          </Link>
        </div>
      </section>
    );
  }

  return <HomeBlocks blocks={blocks} />;
}
