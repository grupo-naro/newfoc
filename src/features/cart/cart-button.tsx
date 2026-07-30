"use client";

/** Botón del carrito en el header: ícono + contador, abre el drawer. */
import { ShoppingCartIcon } from "lucide-react";

import { useCartStore } from "./cart-store";

export function CartButton() {
  const itemCount = useCartStore((state) => state.cart?.itemCount ?? 0);
  const openCart = useCartStore((state) => state.openCart);

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Abrir carrito, ${itemCount} ${itemCount === 1 ? "ítem" : "ítems"}`}
      className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent"
    >
      <ShoppingCartIcon
        className="size-6"
        fill="currentColor"
        strokeWidth={1.5}
      />
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[oklch(0.5_0.22_260)] px-1 text-[11px] font-bold text-white tabular-nums">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </button>
  );
}
