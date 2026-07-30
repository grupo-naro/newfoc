/** Footer del storefront. Marca + navegación + datos de contacto. */
import Link from "next/link";
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";

import { storeConfig } from "@/store.config";

export function Footer() {
  const { name, description, contact } = storeConfig;
  const hasContact =
    contact.email ||
    contact.phone ||
    contact.address ||
    contact.instagram ||
    contact.facebook;

  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div className="max-w-xs">
          <p className="text-base font-bold tracking-tight">{name}</p>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>

        <nav className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Tienda</span>
          <Link
            href="/productos"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Todos los productos
          </Link>
          <Link
            href="/"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Inicio
          </Link>
        </nav>

        {hasContact && (
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Contacto</span>
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <MailIcon className="size-4" />
                {contact.email}
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <PhoneIcon className="size-4" />
                {contact.phone}
              </a>
            )}
            {contact.address && (
              <span className="flex items-start gap-2 text-muted-foreground">
                <MapPinIcon className="mt-0.5 size-4 shrink-0" />
                {contact.address}
              </span>
            )}
            {contact.instagram && (
              <a
                href={`https://instagram.com/${contact.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Instagram · @{contact.instagram}
              </a>
            )}
            {contact.facebook && (
              <a
                href={contact.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Facebook
              </a>
            )}
          </div>
        )}
      </div>

      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {name}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
