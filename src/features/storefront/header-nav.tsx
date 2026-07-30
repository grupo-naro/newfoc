"use client";

/**
 * Nav del header — resalta el link activo con subrayado azul.
 *
 * Vive en cliente porque necesita `usePathname`/`useSearchParams` para
 * marcar el activo. El listado de categorías llega resuelto desde el
 * Header (server) para no duplicar la query.
 *
 * `useSearchParams` exige Suspense en prerender (Next 16), por eso
 * exportamos `<HeaderNav>` que ya envuelve a `<HeaderNavInner>` en
 * Suspense con un fallback sin highlight.
 */
import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/core/lib/utils";
import type { CategoryTreeNode } from "@/core/modules/catalog";

interface HeaderNavProps {
  categories: CategoryTreeNode[];
}

interface NavItem {
  label: string;
  href: string;
  isActive: boolean;
}

function buildItems(
  categories: CategoryTreeNode[],
  pathname: string,
  activeCategory: string | null,
): NavItem[] {
  return [
    { label: "Inicio", href: "/", isActive: pathname === "/" },
    ...categories.map((category) => ({
      label: category.name,
      href: `/productos?category=${category.slug}`,
      isActive: pathname === "/productos" && activeCategory === category.slug,
    })),
    { label: "Ofertas", href: "/ofertas", isActive: pathname === "/ofertas" },
  ];
}

function NavList({ items }: { items: NavItem[] }) {
  return (
    <ul className="flex items-center gap-6 text-sm font-semibold">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            aria-current={item.isActive ? "page" : undefined}
            className={cn(
              "relative py-1 transition-colors hover:text-foreground",
              item.isActive
                ? "text-foreground after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-[oklch(0.5_0.22_260)]"
                : "text-foreground/80",
            )}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function HeaderNavInner({ categories }: HeaderNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <NavList
      items={buildItems(categories, pathname, searchParams.get("category"))}
    />
  );
}

export function HeaderNav({ categories }: HeaderNavProps) {
  // Fallback: misma lista pero sin highlight (no conocemos el pathname
  // en server). Al hidratar, HeaderNavInner aplica el activo real.
  const fallback = <NavList items={buildItems(categories, "", null)} />;

  return (
    <Suspense fallback={fallback}>
      <HeaderNavInner categories={categories} />
    </Suspense>
  );
}
