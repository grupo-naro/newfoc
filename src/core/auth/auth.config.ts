/**
 * Configuración base de Auth.js (M3.1, refactor M3.x).
 *
 * Este archivo es seguro de importar desde el `proxy` — NO incluye el
 * adapter de Prisma, ni providers, ni toca la base. `auth.ts` lo
 * completa con el adapter y el provider Credentials.
 *
 * Login con email + contraseña (post-magic-link). La flag `isAdmin`
 * vive en la base (`User.isAdmin`) y viaja en el JWT — el proxy la lee
 * sin tocar Prisma para mantener el edge runtime feliz.
 *
 * La sesión es JWT: el proxy valida la cookie sin DB.
 */
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  // El proxy sólo lee la sesión — no necesita providers.
  providers: [],
  callbacks: {
    /**
     * Persistimos `id`, `isAdmin` y `mustChangePassword` en el token al
     * primer login (cuando `user` viene poblado por `authorize`).
     */
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.isAdmin = user.isAdmin === true;
        token.mustChangePassword = user.mustChangePassword === true;
      }
      return token;
    },
    /** Expone los flags en la sesión para los Server Components. */
    session({ session, token }) {
      session.user.id = (token.userId as string) ?? session.user.id;
      session.user.isAdmin = token.isAdmin === true;
      session.user.mustChangePassword = token.mustChangePassword === true;
      return session;
    },
    /** Lo usa el proxy para proteger `/admin/*`. */
    authorized({ auth }) {
      return auth?.user?.isAdmin === true;
    },
  },
} satisfies NextAuthConfig;
