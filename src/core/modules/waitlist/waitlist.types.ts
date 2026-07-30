/**
 * Tipos de dominio del módulo waitlist.
 *
 * Wrapper sobre el row de Prisma pero exponiendo sólo lo que el resto
 * de la app necesita. `priceSnapshot` queda inmutable: lo que vio el
 * cliente cuando se anotó. El email actual puede mostrar precio nuevo,
 * pero el snapshot original siempre se preserva como referencia.
 */

export interface WaitlistEntry {
  id: string;
  variantId: string;
  email: string;
  customerName: string | null;
  priceSnapshot: number;
  unsubscribeToken: string;
  notifiedAt: Date | null;
  createdAt: Date;
}

/** Datos resueltos para mandar el email de "volvió el stock". */
export interface WaitlistNotificationContext {
  entry: WaitlistEntry;
  productName: string;
  productSlug: string;
  variantName: string | null;
  currentPrice: number;
  imagePublicId: string | null;
}
