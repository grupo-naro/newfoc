import { redirect } from "next/navigation";
import { LogOutIcon } from "lucide-react";

import { auth, signOutAction } from "@/core/auth";
import { Button } from "@/core/ui/button";
import { AdminMobileHeader } from "@/features/admin/admin-mobile-header";
import { AdminNav } from "@/features/admin/admin-nav";
import { storeConfig } from "@/store.config";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // El proxy ya bloquea `/admin/*`; esto es defensa en profundidad.
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login");

  // Cambio de clave obligatorio: la página `/cambiar-clave` vive fuera
  // de `/admin/*` para evitar el loop con este guard.
  if (session.user.mustChangePassword) {
    redirect("/cambiar-clave");
  }

  const email = session.user.email;

  return (
    <div className="flex flex-1">
      {/* Sidebar — escritorio */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="border-b px-5 py-4">
          <span className="block font-bold tracking-tight">
            {storeConfig.shortName}
          </span>
          <span className="text-xs text-muted-foreground">Panel de la tienda</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <AdminNav />
        </div>

        <div className="border-t p-3">
          {email && (
            <p
              className="truncate px-3 text-xs text-muted-foreground"
              title={email}
            >
              {email}
            </p>
          )}
          <form action={signOutAction} className="mt-2">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3"
            >
              <LogOutIcon className="size-4" />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileHeader userEmail={email} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
