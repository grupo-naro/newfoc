/**
 * Emails de admins — para notificaciones internas.
 *
 * Antes vivía en `ADMIN_EMAILS` (env). Desde el refactor de login
 * (email + contraseña), los admins se guardan en la base (`User.isAdmin`),
 * así que esta función lee de ahí. Se mantiene el nombre para no romper
 * imports existentes en `notifications`.
 */
import { prisma } from "@/core/lib/db";

/**
 * Lista de emails admin para alertas (nuevos pedidos, etc.). Devuelve
 * array vacío si no hay admins cargados — el caller maneja ese caso
 * silenciosamente.
 */
export async function getAdminEmails(): Promise<string[]> {
  const rows = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { email: true },
  });
  return rows.map((row) => row.email);
}
