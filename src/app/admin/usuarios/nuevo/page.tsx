import type { Metadata } from "next";

import { AdminUserForm } from "@/features/admin/admin-user-form";

export const metadata: Metadata = {
  title: "Nuevo admin",
  robots: { index: false },
};

export default function NewAdminUserPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo admin</h1>
        <p className="text-sm text-muted-foreground">
          El nuevo admin va a tener acceso completo al panel.
        </p>
      </div>
      <AdminUserForm />
    </div>
  );
}
