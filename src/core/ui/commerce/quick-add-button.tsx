"use client";

/**
 * Quick-add desde la card de producto.
 *
 * Suma al carrito la variante por defecto (la más barata en stock) y
 * abre el drawer — sin pasar por la PDP. Para productos con variantes
 * múltiples se usa la primera por orden de precio: el cliente puede
 * cambiarla en el carrito o entrando a la PDP.
 */
import { useTransition } from "react";

import { trackAddToCart } from "@/core/integrations/analytics";
import { addToCart } from "@/core/modules/cart";
import { cn } from "@/core/lib/utils";
import { useCartStore } from "@/features/cart/cart-store";

interface QuickAddButtonProps {
  productId: string;
  productName: string;
  variantId: string | null;
  unitPrice: number;
  inStock: boolean;
  className?: string;
}

export function QuickAddButton({
  productId,
  productName,
  variantId,
  unitPrice,
  inStock,
  className,
}: QuickAddButtonProps) {
  const [pending, startTransition] = useTransition();
  const setCart = useCartStore((state) => state.setCart);
  const openCart = useCartStore((state) => state.openCart);

  const disabled = !inStock || !variantId || pending;

  function handleClick() {
    if (!variantId) return;
    startTransition(async () => {
      const updated = await addToCart(variantId, 1);
      setCart(updated);
      openCart();
      trackAddToCart({
        productId,
        name: productName,
        unitPrice,
        quantity: 1,
      });
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "h-11 w-full rounded-md bg-foreground text-xs font-bold uppercase tracking-wider text-background transition-colors hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {pending
        ? "Agregando…"
        : !inStock
          ? "Sin stock"
          : "Agregar al carrito"}
    </button>
  );
}
