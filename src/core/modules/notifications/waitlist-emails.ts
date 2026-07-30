/**
 * Emails del módulo waitlist.
 *
 * Two flujos:
 *  · `sendWaitlistConfirmEmail` — al anotarse, confirmación breve.
 *  · `sendBackInStockEmail` — cuando volvió el stock, con CTA al
 *    producto y link de baja por token.
 *
 * Best-effort: capturan sus propios errores. Un email roto no debe
 * tumbar el flow del cliente ni el de admin guardando stock.
 */
import { sendEmail } from "@/core/integrations/resend";
import { formatPrice } from "@/core/lib/format";
import { SITE_URL } from "@/core/lib/seo";
import { storeConfig } from "@/store.config";

import type {
  WaitlistEntry,
  WaitlistNotificationContext,
} from "@/core/modules/waitlist/waitlist.types";

const STORE_NAME = storeConfig.name;

function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char,
  );
}

interface ConfirmEmailParams {
  entry: WaitlistEntry;
  productName: string;
  variantName: string | null;
}

/** Email de confirmación al anotarse en la lista. */
export async function sendWaitlistConfirmEmail({
  entry,
  productName,
  variantName,
}: ConfirmEmailParams): Promise<void> {
  const display = variantName ? `${productName} (${variantName})` : productName;
  const greeting = entry.customerName ? `¡Hola ${entry.customerName}!` : "¡Hola!";

  const html = `<!doctype html>
<html lang="es">
<body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:12px;padding:28px;">
      <p style="margin:0 0 16px;font-size:13px;font-weight:bold;letter-spacing:0.05em;text-transform:uppercase;color:#737373;">
        ${escapeHtml(STORE_NAME)}
      </p>
      <h1 style="margin:0 0 8px;font-size:20px;color:#171717;">${greeting}</h1>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#525252;">
        Te anotamos en la lista de espera de <strong>${escapeHtml(display)}</strong>.
      </p>
      <p style="margin:0;font-size:14px;line-height:1.5;color:#525252;">
        Te vamos a avisar a este mismo email apenas haya stock disponible.
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    await sendEmail({
      to: entry.email,
      subject: `Te anotamos en la lista · ${display}`,
      html,
    });
  } catch (error) {
    console.error(
      `No se pudo enviar el email de confirmación de waitlist a ${entry.email}:`,
      error,
    );
  }
}

/** Email cuando el stock vuelve — uno por entry. */
export async function sendBackInStockEmail(
  ctx: WaitlistNotificationContext,
): Promise<void> {
  const display = ctx.variantName
    ? `${ctx.productName} (${ctx.variantName})`
    : ctx.productName;
  const greeting = ctx.entry.customerName
    ? `¡Hola ${ctx.entry.customerName}!`
    : "¡Hola!";

  // Precio: si subió o se mantiene, mostramos ambos para transparencia.
  // Si bajó, mostramos sólo el actual (no tiene sentido decir "antes era más").
  const priceWent = ctx.currentPrice > ctx.entry.priceSnapshot;
  const priceBlock = priceWent
    ? `<p style="margin:8px 0 0;font-size:13px;color:#737373;">
        Precio cuando te anotaste: <s>${formatPrice(ctx.entry.priceSnapshot)}</s>
        &middot; Hoy: <strong style="color:#171717;">${formatPrice(ctx.currentPrice)}</strong>
      </p>`
    : `<p style="margin:8px 0 0;font-size:14px;color:#171717;font-weight:bold;">
        ${formatPrice(ctx.currentPrice)}
      </p>`;

  const productUrl = `${SITE_URL}/productos/${ctx.productSlug}`;
  const unsubscribeUrl = `${SITE_URL}/lista-espera/baja?token=${ctx.entry.unsubscribeToken}`;

  const html = `<!doctype html>
<html lang="es">
<body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:12px;padding:28px;">
      <p style="margin:0 0 16px;font-size:13px;font-weight:bold;letter-spacing:0.05em;text-transform:uppercase;color:#737373;">
        ${escapeHtml(STORE_NAME)}
      </p>
      <h1 style="margin:0 0 8px;font-size:20px;color:#171717;">${greeting}</h1>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#525252;">
        Volvió al stock <strong>${escapeHtml(display)}</strong>.
      </p>

      ${priceBlock}

      <a href="${productUrl}"
        style="display:inline-block;margin-top:20px;padding:10px 20px;background:#171717;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;">
        Ver el producto
      </a>

      <p style="margin:24px 0 0;font-size:12px;color:#a3a3a3;border-top:1px solid #e5e5e5;padding-top:16px;">
        ¿No te interesa más? <a href="${unsubscribeUrl}" style="color:#737373;">Quitarme de la lista de espera</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    await sendEmail({
      to: ctx.entry.email,
      subject: `¡Volvió al stock! · ${display}`,
      html,
    });
  } catch (error) {
    console.error(
      `No se pudo enviar el aviso de stock a ${ctx.entry.email}:`,
      error,
    );
  }
}
