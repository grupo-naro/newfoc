/**
 * Bootstrap del superadmin.
 *
 * Garantiza que siempre exista al menos un admin con el email/clave de
 * las env vars `ADMIN_BOOTSTRAP_EMAIL` y `ADMIN_BOOTSTRAP_PASSWORD`. El
 * admin semilla se crea con `mustChangePassword = true` — al primer
 * login se le obliga a cambiarla.
 *
 * Idempotente:
 *  - Si no hay ningún admin → crea el superadmin con la clave de env.
 *  - Si el email ya existe pero no es admin → lo promueve y le setea la
 *    clave (caso: usuario quedó del flujo viejo de magic link).
 *  - Si el superadmin ya existe → no hace nada.
 *
 * Se invoca desde `prisma/seed.ts`. NO se ejecuta en el flujo de
 * request — corre offline o en arranque manual.
 */
import bcrypt from "bcryptjs";

import { prisma } from "@/core/lib/db";

const BCRYPT_ROUNDS = 12;

export async function bootstrapSuperAdmin(): Promise<void> {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  if (!email || !password) {
    console.warn(
      "⚠️  ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD no seteadas — bootstrap salteado.",
    );
    return;
  }

  // ¿Ya hay algún admin? Si sí, no hacemos nada — el bootstrap es
  // solamente para el primer arranque o si la tabla quedó vacía.
  const existingAdmin = await prisma.user.findFirst({ where: { isAdmin: true } });
  if (existingAdmin) {
    console.log(`✓ Ya existe un admin (${existingAdmin.email}) — bootstrap salteado.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Upsert: si el email existe (legado del magic link), lo promueve;
  // si no, lo crea desde cero.
  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      isAdmin: true,
      mustChangePassword: true,
    },
    create: {
      email,
      passwordHash,
      isAdmin: true,
      mustChangePassword: true,
    },
  });

  console.log(
    `✅ Superadmin bootstrappeado: ${email} (debe cambiar la clave al primer login).`,
  );
}
