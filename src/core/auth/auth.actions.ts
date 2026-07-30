"use server";

/**
 * Server Actions de autenticación.
 *
 * `signInWithPassword` valida credenciales contra `User.passwordHash`
 * vía el provider Credentials (ver `auth.ts`). El mensaje de error es
 * genérico — nunca decimos si falló el email o la contraseña, para no
 * facilitar la enumeración de cuentas admin.
 */
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn, signOut } from "./auth";

export async function signInWithPassword(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=credenciales");
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/admin",
    });
  } catch (error) {
    // AuthError = credenciales inválidas (CredentialsSignin u otros).
    // NEXT_REDIRECT se re-lanza para que Next maneje la redirección.
    if (error instanceof AuthError) {
      redirect("/login?error=credenciales");
    }
    throw error;
  }
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
