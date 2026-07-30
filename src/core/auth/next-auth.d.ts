/**
 * Augmentación de tipos de Auth.js.
 *
 * Suma `id`, `isAdmin` y `mustChangePassword` al user/session/JWT —
 * vienen del `authorize` de Credentials y de la base.
 */
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    isAdmin?: boolean;
    mustChangePassword?: boolean;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      isAdmin: boolean;
      mustChangePassword: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    isAdmin?: boolean;
    mustChangePassword?: boolean;
  }
}
