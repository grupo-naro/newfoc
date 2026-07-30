/**
 * Use cases de gestión de usuarios admin.
 *
 * Reglas de integridad:
 *  · No podés borrarte a vos mismo.
 *  · No podés borrar el último admin que queda (la tabla nunca debe
 *    quedar vacía — si pasa, nadie entra al panel).
 *  · Para cambiar la contraseña propia tenés que ingresar la actual.
 *  · Al resetear la clave de otro admin, queda con `mustChangePassword`
 *    en true para forzarlo a cambiarla en el próximo login.
 */
import bcrypt from "bcryptjs";

import * as repo from "./admin-users.repository";
import type { AdminUserRow } from "./admin-users.repository";
import {
  changePasswordSchema,
  createAdminSchema,
  resetPasswordSchema,
} from "./admin-users.schemas";

const BCRYPT_ROUNDS = 12;

export class AdminUsersError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminUsersError";
  }
}

export async function listAdmins(): Promise<AdminUserRow[]> {
  return repo.listAdmins();
}

export async function createAdmin(
  rawInput: unknown,
  createdById: string,
): Promise<{ id: string; email: string }> {
  const input = createAdminSchema.parse(rawInput);

  const existing = await repo.findAdminByEmail(input.email);
  if (existing) {
    throw new AdminUsersError("Ya existe un admin con ese email.");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  return repo.createAdmin({
    email: input.email,
    name: input.name ?? null,
    passwordHash,
    createdById,
  });
}

export async function deleteAdmin(
  targetId: string,
  currentUserId: string,
): Promise<void> {
  if (targetId === currentUserId) {
    throw new AdminUsersError("No podés eliminar tu propia cuenta.");
  }
  const target = await repo.findAdminById(targetId);
  if (!target) {
    throw new AdminUsersError("El admin no existe.");
  }
  const total = await repo.countAdmins();
  if (total <= 1) {
    throw new AdminUsersError("No podés eliminar el último admin.");
  }
  await repo.deleteAdmin(targetId);
}

export async function changeOwnPassword(
  userId: string,
  rawInput: unknown,
): Promise<void> {
  const input = changePasswordSchema.parse(rawInput);

  const currentHash = await repo.getPasswordHash(userId);
  if (!currentHash) {
    throw new AdminUsersError("Tu cuenta no tiene contraseña configurada.");
  }
  const ok = await bcrypt.compare(input.currentPassword, currentHash);
  if (!ok) {
    throw new AdminUsersError("La contraseña actual es incorrecta.");
  }

  const newHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
  await repo.updatePassword(userId, newHash, false);
}

export async function resetAdminPassword(
  targetId: string,
  rawInput: unknown,
  currentUserId: string,
): Promise<void> {
  const input = resetPasswordSchema.parse(rawInput);

  const target = await repo.findAdminById(targetId);
  if (!target) {
    throw new AdminUsersError("El admin no existe.");
  }

  const newHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
  // Si el admin se resetea a sí mismo desde acá (no debería pasar — para
  // eso está changeOwnPassword), no le forzamos cambio en el próximo login.
  const mustChange = targetId !== currentUserId;
  await repo.updatePassword(targetId, newHash, mustChange);
}
