"use client";

/**
 * Botón "Eliminar admin" con confirmación. Si el use-case rechaza
 * (último admin, o borrarse a sí mismo), muestra el error.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";

import { deleteAdminAction } from "@/core/modules/admin-users/admin-users.actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/core/ui/alert-dialog";
import { Button } from "@/core/ui/button";

interface DeleteAdminUserButtonProps {
  userId: string;
  email: string;
}

export function DeleteAdminUserButton({
  userId,
  email,
}: DeleteAdminUserButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAdminAction(userId);
      if (result.ok) {
        router.refresh();
        return;
      }
      setError(result.error);
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-destructive">
          <Trash2Icon className="size-4" />
          Eliminar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar a {email}?</AlertDialogTitle>
          <AlertDialogDescription>
            Este admin va a perder acceso al panel inmediatamente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={pending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending ? "Eliminando…" : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
