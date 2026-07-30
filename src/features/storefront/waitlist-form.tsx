"use client";

/**
 * Form de suscripción a la lista de espera.
 *
 * Se renderiza en la PDP cuando la variante seleccionada no tiene stock.
 * Pide email + nombre opcional, llama a `subscribeToWaitlist` y muestra
 * confirmación inline. Se rerendea si cambia `variantId` (otra variante
 * elegida) para resetear el estado.
 */
import { useEffect, useState, useTransition } from "react";
import { MailIcon, CheckCircle2Icon } from "lucide-react";

// Import directo (no por barrel) para no arrastrar Prisma al bundle cliente.
import { subscribeToWaitlist } from "@/core/modules/waitlist/waitlist.actions";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";

interface WaitlistFormProps {
  variantId: string;
}

export function WaitlistForm({ variantId }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Reset al cambiar de variante.
  useEffect(() => {
    setEmail("");
    setName("");
    setError(null);
    setDone(false);
  }, [variantId]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Ingresá tu email.");
      return;
    }
    startTransition(async () => {
      const result = await subscribeToWaitlist({
        variantId,
        email: email.trim(),
        customerName: name.trim() || undefined,
      });
      if (result.ok) {
        setDone(true);
      } else {
        setError(result.error);
      }
    });
  }

  if (done) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <CheckCircle2Icon className="size-5 shrink-0" />
        <div>
          <p className="font-semibold">¡Listo! Te anotamos.</p>
          <p className="text-emerald-800">
            Te avisamos por mail apenas haya stock disponible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border bg-card p-4"
    >
      <div className="flex items-start gap-3">
        <MailIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Avisame cuando vuelva</p>
          <p className="text-xs text-muted-foreground">
            Te mandamos un mail apenas haya stock de esta variante.
          </p>
        </div>
      </div>

      <Input
        type="email"
        required
        autoComplete="email"
        placeholder="tu@email.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={pending}
      />
      <Input
        type="text"
        autoComplete="name"
        placeholder="Tu nombre (opcional)"
        value={name}
        onChange={(event) => setName(event.target.value)}
        disabled={pending}
      />

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Anotando…" : "Avisame"}
      </Button>
    </form>
  );
}
