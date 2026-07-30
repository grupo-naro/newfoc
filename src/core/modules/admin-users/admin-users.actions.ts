"use server";

/**
 * Server Actions de gestión de usuarios admin.
 *
 * Cada action revalida `/admin/usuarios` después de mutar. Los errores
 * de validación o de negocio (`AdminUsersError`, `ZodError`) se
 * devuelven como `{ ok: false, error }` para mostrarse en el form.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { auth, signOutAction } from "@/core/auth";

import {
  AdminUsersError,
  changeOwnPassword,
  createAdmin,
  deleteAdmin,
  resetAdminPassword,
} from "./admin-users.use-cases";

export type AdminUserActionResult = { ok: true } | { ok: false; error: string };

function firstZodMessage(error: ZodError): string {
  return error.issues[0]?.message ?? "Datos inválidos.";
}

async function requireAdminId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id || !session.user.isAdmin) {
    throw new Error("UNAUTHORIZED");
  }
  return session.user.id;
}

export async function createAdminAction(
  formData: FormData,
): Promise<AdminUserActionResult> {
  let createdById: string;
  try {
    createdById = await requireAdminId();
  } catch {
    return { ok: false, error: "Sesión inválida." };
  }

  try {
    await createAdmin(
      {
        email: formData.get("email"),
        name: formData.get("name") || null,
        password: formData.get("password"),
      },
      createdById,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: firstZodMessage(error) };
    }
    if (error instanceof AdminUsersError) {
      return { ok: false, error: error.message };
    }
    console.error("No se pudo crear el admin:", error);
    return { ok: false, error: "No se pudo crear el admin." };
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function deleteAdminAction(
  targetId: string,
): Promise<AdminUserActionResult> {
  let currentUserId: string;
  try {
    currentUserId = await requireAdminId();
  } catch {
    return { ok: false, error: "Sesión inválida." };
  }

  try {
    await deleteAdmin(targetId, currentUserId);
  } catch (error) {
    if (error instanceof AdminUsersError) {
      return { ok: false, error: error.message };
    }
    console.error("No se pudo eliminar el admin:", error);
    return { ok: false, error: "No se pudo eliminar el admin." };
  }

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function resetAdminPasswordAction(
  targetId: string,
  formData: FormData,
): Promise<AdminUserActionResult> {
  let currentUserId: string;
  try {
    currentUserId = await requireAdminId();
  } catch {
    return { ok: false, error: "Sesión inválida." };
  }

  try {
    await resetAdminPassword(
      targetId,
      { newPassword: formData.get("newPassword") },
      currentUserId,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: firstZodMessage(error) };
    }
    if (error instanceof AdminUsersError) {
      return { ok: false, error: error.message };
    }
    console.error("No se pudo resetear la contraseña:", error);
    return { ok: false, error: "No se pudo resetear la contraseña." };
  }

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

/**
 * Cambia la contraseña del admin actual. Si tiene éxito, lo desloguea
 * y manda al login — el JWT viejo trae `mustChangePassword=true` y hay
 * que renovarlo entrando de nuevo.
 *
 * Devuelve `AdminUserActionResult` sólo en el error path; en el camino
 * feliz hace signOut + redirect y no vuelve. Por eso el caller debe
 * chequear el shape con `if (result && result.ok === false)`.
 */
export async function changeOwnPasswordAction(
  formData: FormData,
): Promise<AdminUserActionResult | void> {
  let currentUserId: string;
  try {
    currentUserId = await requireAdminId();
  } catch {
    return { ok: false, error: "Sesión inválida." };
  }

  try {
    await changeOwnPassword(currentUserId, {
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: firstZodMessage(error) };
    }
    if (error instanceof AdminUsersError) {
      return { ok: false, error: error.message };
    }
    console.error("No se pudo cambiar la contraseña:", error);
    return { ok: false, error: "No se pudo cambiar la contraseña." };
  }

  // Sign-out + redirect — fuerza renovar JWT con el flag al día.
  await signOutAction();
}
