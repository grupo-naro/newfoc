"use client";

/**
 * Formulario de cambio de contraseña — lo usan tanto la página obligatoria
 * `/cambiar-clave` (primer login del superadmin / reset) como el admin
 * que quiere cambiarla voluntariamente.
 */
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { changeOwnPasswordAction } from "@/core/modules/admin-users/admin-users.actions";
import { changePasswordSchema } from "@/core/modules/admin-users/admin-users.schemas";
import { Button } from "@/core/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/core/ui/form";
import { Input } from "@/core/ui/input";

interface FormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const EMPTY: FormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
  });

  function onSubmit(values: FormValues) {
    setServerError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("currentPassword", values.currentPassword);
      fd.set("newPassword", values.newPassword);
      fd.set("confirmPassword", values.confirmPassword);
      const result = await changeOwnPasswordAction(fd);
      // Si éxito, la action hace signOut + redirect a /login. Sólo llegamos
      // acá si vuelve un `{ ok: false, error }`.
      if (result && result.ok === false) {
        setServerError(result.error);
      }
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña actual</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nueva contraseña</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Repetir nueva contraseña</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar contraseña"}
        </Button>
      </form>
    </Form>
  );
}
