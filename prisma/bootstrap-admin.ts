/**
 * Bootstrap del superadmin — script standalone.
 *
 * A diferencia de `seed.ts`, este script NO toca el catálogo. Sirve
 * para crear el primer admin (o garantizar que exista) sin perder
 * productos / categorías.
 *
 * Correr con: `pnpm db:bootstrap`. Lee `ADMIN_BOOTSTRAP_EMAIL` y
 * `ADMIN_BOOTSTRAP_PASSWORD` del entorno (ver `.env`).
 */
import "dotenv/config";

import { bootstrapSuperAdmin } from "@/core/auth/bootstrap-admin";
import { prisma } from "@/core/lib/db";

async function main() {
  await bootstrapSuperAdmin();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("❌ Bootstrap falló:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
