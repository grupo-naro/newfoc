/**
 * Header del storefront.
 *
 * La navegación de categorías sale de la base (query chica), así que
 * se renderiza inline — no vale la pena un <Suspense> para streamear
 * un fragmento tan pequeño.
 */
import Image from "next/image";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { getCategoryTree } from "@/core/modules/catalog";
import { CartButton } from "@/features/cart/cart-button";
import { storeConfig } from "@/store.config";

import { HeaderNav } from "./header-nav";

export async function Header() {
  const categories = await getCategoryTree();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-6 px-4">
        <Link href="/" aria-label={storeConfig.name} className="shrink-0">
          <Image
            src="/logo.png"
            alt=""
            width={264}
            height={40}
            priority
            className="h-20 w-auto"
          />
        </Link>

        <form
          action="/productos"
          role="search"
          className="flex-1 max-w-xl mx-auto"
        >
          <label htmlFor="header-search" className="sr-only">
            Buscar productos
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              id="header-search"
              name="q"
              type="search"
              placeholder="¿Qué estás buscando hoy?"
              className="h-11 w-full rounded-full border border-transparent bg-muted pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-ring focus:bg-background focus:outline-none"
            />
          </div>
        </form>

        <nav className="hidden lg:block">
          <HeaderNav categories={categories} />
        </nav>

        <CartButton />
      </div>
    </header>
  );
}
