import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/core/auth";
import { ChangePasswordForm } from "@/features/auth/change-password-form";

export const metadata: Metadata = {
  title: "Cambiar contraseña",
  robots: { index: false },
};

/**
 * `/cambiar-clave` — vive fuera de `/admin/*` a propósito, para evitar
 * el loop con el guard de `mustChangePassword` en el layout admin.
 *
 * Requiere sesión admin pero NO chequea `mustChangePassword` — es el
 * único lugar donde se puede entrar con ese flag activo.
 */
export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login");

  return (
    <main className="grid min-h-full place-items-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight">Cambiar contraseña</h1>
        {session.user.mustChangePassword ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Tu contraseña es temporal. Definí una nueva para seguir.
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresá tu contraseña actual y elegí una nueva.
          </p>
        )}
        <div className="mt-6">
          <ChangePasswordForm />
        </div>
      </div>
    </main>
  );
}
