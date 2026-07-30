"use client";

/**
 * Diálogo para resetear la contraseña de otro admin. El admin afectado
 * queda con `mustChangePassword = true` — la próxima vez que entre se
 * le va a forzar el cambio.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyIcon } from "lucide-react";

import { resetAdminPasswordAction } from "@/core/modules/admin-users/admin-users.actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/core/ui/alert-dialog";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";

interface ResetAdminPasswordDialogProps {
  userId: string;
  email: string;
}

export function ResetAdminPasswordDialog({
  userId,
  email,
}: ResetAdminPasswordDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await resetAdminPasswordAction(userId, formData);
      if (result.ok) {
        setOpen(false);
        router.refresh();
        return;
      }
      setError(result.error);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <KeyIcon className="size-4" />
          Resetear clave
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resetear contraseña</AlertDialogTitle>
          <AlertDialogDescription>
            Definí una nueva contraseña temporal para <strong>{email}</strong>.
            Se le va a pedir cambiarla al próximo ingreso.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword">Nueva contraseña</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Resetear"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
