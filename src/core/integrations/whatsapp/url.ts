/**
 * Helpers para armar la URL de wa.me.
 */
import { WHATSAPP_PHONE } from "./config";

/** URL `https://wa.me/...` con el mensaje URL-encoded. */
export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

/**
 * URL `wa.me` para escribirle al teléfono de un cliente.
 *
 * Sólo dígitos en el número — espacios, guiones, paréntesis y el `+` se
 * descartan. Si el cliente cargó el teléfono SIN código de país, el link
 * no va a abrir el chat correcto: WhatsApp pide formato internacional.
 * Devuelve `null` si el teléfono no tiene dígitos.
 */
export function buildCustomerWhatsAppUrl(
  phone: string | null | undefined,
  message?: string,
): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return null;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}
