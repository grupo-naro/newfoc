/**
 * Use cases del módulo waitlist.
 *
 * `notifyVariantReplenished` se llama desde la action de admin al
 * guardar una variante cuando el stock pasó de 0 a > 0. Carga las
 * entries pendientes, resuelve el contexto (producto + precio actual),
 * manda los emails y las marca como notificadas.
 *
 * Diseñado idempotente: si se llama dos veces seguidas, la segunda no
 * encuentra entries pendientes (la primera ya las marcó) y no manda
 * nada.
 */
import { sendBackInStockEmail } from "@/core/modules/notifications/waitlist-emails";

import * as repo from "./waitlist.repository";

/** Procesa todas las notificaciones pendientes para una variante. */
export async function notifyVariantReplenished(variantId: string): Promise<{
  notified: number;
}> {
  const pending = await repo.findPendingForVariant(variantId);
  if (pending.length === 0) return { notified: 0 };

  const contexts = await repo.loadNotificationContext(pending);

  // Mandamos en serie para no abrumar a Resend; los try/catch viven
  // dentro de cada `sendBackInStockEmail`, así un email roto no rompe
  // el resto del batch.
  for (const ctx of contexts) {
    await sendBackInStockEmail(ctx);
  }

  await repo.markNotified(contexts.map((c) => c.entry.id));
  return { notified: contexts.length };
}

/** Procesa replenishment para varias variantes (en paralelo). */
export async function notifyVariantsReplenished(
  variantIds: string[],
): Promise<void> {
  if (variantIds.length === 0) return;
  await Promise.all(variantIds.map((id) => notifyVariantReplenished(id)));
}
