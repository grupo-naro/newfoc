/**
 * Módulo Auth — API pública.
 *
 * Autenticación del panel admin con email + contraseña (Auth.js v5,
 * provider Credentials). El proxy importa `auth.config` directamente,
 * no este barrel (que arrastra el adapter de Prisma).
 */
export { auth, signIn, signOut } from "./auth";
export { signInWithPassword, signOutAction } from "./auth.actions";
export { getAdminEmails } from "./admin-allowlist";
export { bootstrapSuperAdmin } from "./bootstrap-admin";
