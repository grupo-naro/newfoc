/**
 * Bloque "Grilla de categorías" — fila de accesos directos tipo
 * "círculo con icono + label", al estilo del shortcut bar de MercadoLibre.
 *
 * Renderiza las categorías raíz activas en orden + el shortcut fijo a
 * /ofertas al final. El icono sale del campo `Category.icon` (slug
 * lucide); si no está, fallback a `Package`.
 *
 * Layout: tira horizontal scrolleable en mobile, distribución uniforme
 * en desktop.
 */
import Link from "next/link";
import { Tag } from "lucide-react";

import { resolveCategoryIcon } from "@/core/lib/category-icons";
import { cn } from "@/core/lib/utils";
import { getCategoryTree } from "@/core/modules/catalog";
import type { CategoryGridData } from "@/core/modules/cms";

interface ShortcutItem {
  key: string;
  label: string;
  href: string;
  iconSlug: string | null;
  /** Si está seteado, ignora `iconSlug` y usa este componente directo. */
  ForcedIcon?: typeof Tag;
}

export async function CategoryGridBlock({
  data,
}: {
  data: CategoryGridData;
}) {
  const categories = await getCategoryTree();
  if (categories.length === 0) return null;

  const items: ShortcutItem[] = [
    ...categories.map((category) => ({
      key: category.id,
      label: category.name,
      href: `/productos?category=${category.slug}`,
      iconSlug: category.icon,
    })),
    {
      key: "__ofertas__",
      label: "Ofertas",
      href: "/ofertas",
      iconSlug: null,
      ForcedIcon: Tag,
    },
  ];

  return (
    <section className="bg-background py-8">
      <div className="mx-auto max-w-7xl px-4">
        {data.heading && (
          <h2 className="mb-6 text-xl font-semibold tracking-tight">
            {data.heading}
          </h2>
        )}
        <ul
          className={cn(
            "-mx-4 flex gap-2 overflow-x-auto px-4 pb-2",
            "sm:mx-0 sm:justify-around sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0",
          )}
        >
          {items.map((item) => {
            const Icon = item.ForcedIcon ?? resolveCategoryIcon(item.iconSlug);
            return (
              <li key={item.key} className="shrink-0">
                <Link
                  href={item.href}
                  className="group flex w-20 flex-col items-center gap-2 outline-none sm:w-24"
                >
                  <span
                    className="flex size-16 items-center justify-center rounded-full bg-muted text-foreground transition-colors group-hover:bg-accent group-focus-visible:ring-2 group-focus-visible:ring-ring sm:size-17"
                    aria-hidden="true"
                  >
                    <Icon className="size-7" strokeWidth={1.75} />
                  </span>
                  <span className="line-clamp-2 text-center text-xs font-semibold leading-tight text-foreground sm:text-sm">
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
