"use client";

/**
 * Formulario para crear un usuario admin. Sigue el patrón de los
 * otros forms del panel (react-hook-form + Zod + action).
 */
import { useState, useTransition } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createAdminAction } from "@/core/modules/admin-users/admin-users.actions";
import { createAdminFormSchema } from "@/core/modules/admin-users/admin-users.schemas";
import { Button, buttonVariants } from "@/core/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/core/ui/form";
import { Input } from "@/core/ui/input";

interface FormValues {
  email: string;
  name: string;
  password: string;
}

const EMPTY: FormValues = { email: "", name: "", password: "" };

export function AdminUserForm() {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(createAdminFormSchema),
    defaultValues: EMPTY,
  });

  function onSubmit(values: FormValues) {
    setServerError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("email", values.email);
      fd.set("name", values.name);
      fd.set("password", values.password);
      const result = await createAdminAction(fd);
      if (result && result.ok === false) {
        setServerError(result.error);
      }
      // Caso éxito: la action redirige a /admin/usuarios.
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex max-w-lg flex-col gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Datos del admin</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="off"
                      placeholder="nuevo@newfoc.com.ar"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña temporal</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Mínimo 6 caracteres, con al menos una mayúscula y un número.
                    El nuevo admin va a tener que cambiarla en su primer ingreso.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {serverError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Creando…" : "Crear admin"}
          </Button>
          <Link
            href="/admin/usuarios"
            className={buttonVariants({ variant: "ghost" })}
          >
            Cancelar
          </Link>
        </div>
      </form>
    </Form>
  );
}
