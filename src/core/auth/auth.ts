/**
 * Instancia de Auth.js — configuración completa.
 *
 * Suma a `authConfig` el adapter de Prisma y el provider Credentials
 * (email + contraseña). El adapter persiste `User`; las sesiones son
 * JWT (no se usan filas de `Session`).
 *
 * Server-side only — no importar desde componentes cliente ni desde
 * el proxy (usar `auth.config.ts` ahí).
 */
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/core/lib/db";

import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            isAdmin: true,
            passwordHash: true,
            mustChangePassword: true,
          },
        });
        // No revelamos si el email existe — mismo `null` en cualquier fallo.
        if (!user || !user.isAdmin || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
});
