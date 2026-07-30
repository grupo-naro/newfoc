/**
 * Repositorio del módulo waitlist — única capa que habla con Prisma.
 */
import { prisma } from "@/core/lib/db";

import type {
  WaitlistEntry,
  WaitlistNotificationContext,
} from "./waitlist.types";

function toEntry(row: {
  id: string;
  variantId: string;
  email: string;
  customerName: string | null;
  priceSnapshot: number;
  unsubscribeToken: string;
  notifiedAt: Date | null;
  createdAt: Date;
}): WaitlistEntry {
  return {
    id: row.id,
    variantId: row.variantId,
    email: row.email,
    customerName: row.customerName,
    priceSnapshot: row.priceSnapshot,
    unsubscribeToken: row.unsubscribeToken,
    notifiedAt: row.notifiedAt,
    createdAt: row.createdAt,
  };
}

/**
 * Crea o actualiza una suscripción. Si el (variantId, email) ya existía,
 * se "revive": se resetea `notifiedAt` y se actualiza el `priceSnapshot`
 * con el precio actual. Así, si ya le avisamos y el producto volvió a
 * quedarse sin stock, el cliente puede pedir aviso de nuevo.
 */
export async function upsertEntry(input: {
  variantId: string;
  email: string;
  customerName: string | null;
  priceSnapshot: number;
}): Promise<WaitlistEntry> {
  const row = await prisma.waitlistEntry.upsert({
    where: {
      variantId_email: {
        variantId: input.variantId,
        email: input.email.toLowerCase(),
      },
    },
    create: {
      variantId: input.variantId,
      email: input.email.toLowerCase(),
      customerName: input.customerName,
      priceSnapshot: input.priceSnapshot,
    },
    update: {
      customerName: input.customerName,
      priceSnapshot: input.priceSnapshot,
      notifiedAt: null,
    },
  });
  return toEntry(row);
}

/** Entries pendientes de notificar para una variante. */
export async function findPendingForVariant(
  variantId: string,
): Promise<WaitlistEntry[]> {
  const rows = await prisma.waitlistEntry.findMany({
    where: { variantId, notifiedAt: null },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toEntry);
}

/**
 * Resuelve el contexto necesario para mandar el email de "volvió el
 * stock" — datos del producto + variante + imagen + precio actual.
 */
export async function loadNotificationContext(
  entries: WaitlistEntry[],
): Promise<WaitlistNotificationContext[]> {
  if (entries.length === 0) return [];
  const variantIds = Array.from(new Set(entries.map((e) => e.variantId)));
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: {
      id: true,
      name: true,
      price: true,
      product: {
        select: {
          name: true,
          slug: true,
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: { publicId: true },
          },
        },
      },
    },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  return entries.flatMap((entry) => {
    const variant = byId.get(entry.variantId);
    if (!variant) return [];
    return [
      {
        entry,
        productName: variant.product.name,
        productSlug: variant.product.slug,
        variantName: variant.name,
        currentPrice: variant.price,
        imagePublicId: variant.product.images[0]?.publicId ?? null,
      },
    ];
  });
}

/** Marca un batch de entries como notificadas (todas con el mismo timestamp). */
export async function markNotified(entryIds: string[]): Promise<void> {
  if (entryIds.length === 0) return;
  await prisma.waitlistEntry.updateMany({
    where: { id: { in: entryIds } },
    data: { notifiedAt: new Date() },
  });
}

/** Borra la entry asociada a un token — para el link de unsubscribe. */
export async function deleteByToken(token: string): Promise<boolean> {
  const result = await prisma.waitlistEntry.deleteMany({
    where: { unsubscribeToken: token },
  });
  return result.count > 0;
}

/** Snapshot mínimo de una variante para validar al suscribirse. */
export async function findVariantForSubscription(variantId: string): Promise<{
  id: string;
  price: number;
  stock: number;
  isActive: boolean;
} | null> {
  return prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { id: true, price: true, stock: true, isActive: true },
  });
}
