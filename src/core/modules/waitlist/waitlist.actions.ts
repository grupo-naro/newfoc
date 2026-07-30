"use server";

/**
 * Server Actions del módulo waitlist — flujo público.
 *
 * `subscribeToWaitlist` valida que la variante exista y esté inactiva
 * de stock (no tiene sentido anotarse a algo que se puede comprar ya),
 * crea/actualiza la entry y manda email de confirmación.
 *
 * `unsubscribeFromWaitlist` borra la entry por token — para el link
 * del email.
 */
import { prisma } from "@/core/lib/db";
import { sendWaitlistConfirmEmail } from "@/core/modules/notifications/waitlist-emails";

import * as repo from "./waitlist.repository";
import { subscribeSchema } from "./waitlist.schemas";

export type SubscribeResult =
  | { ok: true }
  | { ok: false; error: string };

export async function subscribeToWaitlist(
  input: unknown,
): Promise<SubscribeResult> {
  const parsed = subscribeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Revisá los datos." };
  }
  const { variantId, email, customerName } = parsed.data;

  const variant = await repo.findVariantForSubscription(variantId);
  if (!variant || !variant.isActive) {
    return { ok: false, error: "Este producto ya no está disponible." };
  }
  if (variant.stock > 0) {
    return {
      ok: false,
      error: "Este producto ya tiene stock — podés agregarlo al carrito.",
    };
  }

  let entry;
  let productName = "";
  let variantName: string | null = null;
  try {
    entry = await repo.upsertEntry({
      variantId,
      email,
      customerName: customerName?.trim() || null,
      priceSnapshot: variant.price,
    });

    // Resolvemos producto + variante para el email de confirmación.
    const details = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { name: true, product: { select: { name: true } } },
    });
    if (details) {
      productName = details.product.name;
      variantName = details.name;
    }
  } catch (error) {
    console.error("No se pudo anotar en la waitlist:", error);
    return {
      ok: false,
      error: "No pudimos anotarte. Intentá de nuevo.",
    };
  }

  await sendWaitlistConfirmEmail({ entry, productName, variantName });
  return { ok: true };
}

export type UnsubscribeResult = { ok: true; existed: boolean };

export async function unsubscribeFromWaitlist(
  token: string,
): Promise<UnsubscribeResult> {
  const existed = await repo.deleteByToken(token);
  return { ok: true, existed };
}
