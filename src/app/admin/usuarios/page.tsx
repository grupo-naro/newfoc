import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, UsersIcon } from "lucide-react";

import { auth } from "@/core/auth";
import { listAdmins } from "@/core/modules/admin-users";
import { Badge } from "@/core/ui/badge";
import { buttonVariants } from "@/core/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";
import { DeleteAdminUserButton } from "@/features/admin/delete-admin-user-button";
import { ResetAdminPasswordDialog } from "@/features/admin/reset-admin-password-dialog";

export const metadata: Metadata = {
  title: "Usuarios",
  robots: { index: false },
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(date);
}

export default async function AdminUsersPage() {
  const [session, admins] = await Promise.all([auth(), listAdmins()]);
  const currentUserId = session?.user?.id ?? null;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            {admins.length === 1
              ? "1 admin con acceso al panel."
              : `${admins.length} admins con acceso al panel.`}
          </p>
        </div>
        <Link href="/admin/usuarios/nuevo" className={buttonVariants()}>
          <PlusIcon className="size-4" />
          Nuevo admin
        </Link>
      </div>

      {admins.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <UsersIcon className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No hay admins cargados.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Por</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => {
                const isSelf = admin.id === currentUserId;
                return (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      {admin.email}
                      {isSelf && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (vos)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {admin.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(admin.createdAt)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {admin.createdBy?.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      {admin.mustChangePassword ? (
                        <Badge variant="outline">Clave temporal</Badge>
                      ) : (
                        <Badge>Activo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {!isSelf && (
                          <>
                            <ResetAdminPasswordDialog
                              userId={admin.id}
                              email={admin.email}
                            />
                            <DeleteAdminUserButton
                              userId={admin.id}
                              email={admin.email}
                            />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
