/**
 * /lista-espera/baja?token=... — desuscripción de la lista de espera.
 *
 * El link sale del email "volvió el stock" y del email de confirmación
 * (futuro). Borra la entry asociada al token y muestra confirmación.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2Icon, AlertCircleIcon } from "lucide-react";

import { cn } from "@/core/lib/utils";
import { unsubscribeFromWaitlist } from "@/core/modules/waitlist";
import { buttonVariants } from "@/core/ui/button";

export const metadata: Metadata = {
  title: "Baja de lista de espera",
  robots: { index: false },
};

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function WaitlistUnsubscribePage({
  searchParams,
}: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <AlertCircleIcon className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-3 text-xl font-bold tracking-tight">
          Link inválido
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          El enlace de baja no incluye el token. Probá entrar directo desde
          el email que recibiste.
        </p>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }), "mt-6")}
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  const result = await unsubscribeFromWaitlist(token);

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <CheckCircle2Icon className="mx-auto size-12 text-primary" />
      <h1 className="mt-3 text-xl font-bold tracking-tight">
        {result.existed ? "Te sacamos de la lista" : "Listo"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {result.existed
          ? "No vas a recibir más avisos por esta variante."
          : "Esa suscripción ya no estaba activa. No hay nada que hacer."}
      </p>
      <Link
        href="/productos"
        className={cn(buttonVariants({ variant: "outline" }), "mt-6")}
      >
        Seguir explorando
      </Link>
    </div>
  );
}
