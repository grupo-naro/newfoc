/**
 * Módulo Admin Users — API pública.
 *
 * Gestión de usuarios con acceso al panel (CRUD + cambio de
 * contraseña). El login en sí vive en `@/core/auth`.
 */
export {
  changeOwnPasswordAction,
  createAdminAction,
  deleteAdminAction,
  resetAdminPasswordAction,
  type AdminUserActionResult,
} from "./admin-users.actions";

export {
  changeOwnPassword,
  createAdmin,
  deleteAdmin,
  listAdmins,
  resetAdminPassword,
  AdminUsersError,
} from "./admin-users.use-cases";

export type { AdminUserRow } from "./admin-users.repository";

export {
  passwordSchema,
  createAdminSchema,
  createAdminFormSchema,
  changePasswordSchema,
  resetPasswordSchema,
} from "./admin-users.schemas";
