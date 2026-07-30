/**
 * Validación del módulo waitlist.
 */
import { z } from "zod";

export const subscribeSchema = z.object({
  variantId: z.string().min(1),
  email: z.string().email("Email inválido"),
  customerName: z.string().trim().max(80).optional(),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;
