/**
 * Configuración de la tienda — UNA fila para clonar el framework.
 *
 * Cambiar este archivo + las env vars es lo que diferencia una tienda
 * de otra:
 *  · `name`/`tagline`/`description`: cómo se llama y vende.
 *  · `contact`: emails/teléfonos/redes que aparecen en el footer.
 *  · `theme`: tokens oklch (light/dark) inyectados como CSS vars desde
 *    el layout — los componentes consumen `bg-background`/`text-primary`
 *    etc. y nunca valores literales, así cambiar la identidad es sólo
 *    editar este archivo.
 *
 * Pensado para que un clonado sea: copiar repo → editar este archivo
 * + las env vars del cliente → desplegar.
 */

export interface StoreContact {
  /** Dirección de mail visible para el cliente. */
  email?: string;
  /** Teléfono visible en footer/contacto. WhatsApp va por env aparte. */
  phone?: string;
  /** Dirección física, una línea. */
  address?: string;
  /** Handle de Instagram sin `@`. */
  instagram?: string;
  /** URL completa de la página de Facebook. */
  facebook?: string;
}

/**
 * Set de tokens shadcn — valores oklch (lo que entiende globals.css).
 * El layout los lee de acá y los emite como `:root { --primary: ... }`.
 */
export interface StoreThemeTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

export interface StoreTheme {
  light: StoreThemeTokens;
  dark: StoreThemeTokens;
  /** Radio base — se propaga a sm/md/lg/xl en @theme inline. */
  radius: string;
}

export interface StoreConfig {
  /** Nombre completo — title, OG, footer. */
  name: string;
  /** Variante corta para sidebars del admin. */
  shortName: string;
  /** Frase comercial que se usa en home + metadata. */
  tagline: string;
  /** Descripción larga (meta description + OG). */
  description: string;
  /** Locale del sitio (afecta OG y formato de moneda). */
  locale: string;
  contact: StoreContact;
  theme: StoreTheme;
}

// ─── Tema "Commerce Core" (demo) ──────────────────────────────
// Estos son los valores que vivían hardcoded en globals.css —
// quedan acá como default. Sobreescribirlos = retematizar la tienda.

const DEMO_LIGHT: StoreThemeTokens = {
  background: "oklch(1 0 0)",
  foreground: "oklch(0.145 0 0)",
  card: "oklch(1 0 0)",
  cardForeground: "oklch(0.145 0 0)",
  popover: "oklch(1 0 0)",
  popoverForeground: "oklch(0.145 0 0)",
  primary: "oklch(0.205 0 0)",
  primaryForeground: "oklch(0.985 0 0)",
  secondary: "oklch(0.97 0 0)",
  secondaryForeground: "oklch(0.205 0 0)",
  muted: "oklch(0.97 0 0)",
  mutedForeground: "oklch(0.556 0 0)",
  accent: "oklch(0.97 0 0)",
  accentForeground: "oklch(0.205 0 0)",
  destructive: "oklch(0.577 0.245 27.325)",
  destructiveForeground: "oklch(0.985 0 0)",
  border: "oklch(0.922 0 0)",
  input: "oklch(0.922 0 0)",
  ring: "oklch(0.708 0 0)",
};

const DEMO_DARK: StoreThemeTokens = {
  background: "oklch(0.145 0 0)",
  foreground: "oklch(0.985 0 0)",
  card: "oklch(0.205 0 0)",
  cardForeground: "oklch(0.985 0 0)",
  popover: "oklch(0.205 0 0)",
  popoverForeground: "oklch(0.985 0 0)",
  primary: "oklch(0.985 0 0)",
  primaryForeground: "oklch(0.205 0 0)",
  secondary: "oklch(0.269 0 0)",
  secondaryForeground: "oklch(0.985 0 0)",
  muted: "oklch(0.269 0 0)",
  mutedForeground: "oklch(0.708 0 0)",
  accent: "oklch(0.269 0 0)",
  accentForeground: "oklch(0.985 0 0)",
  destructive: "oklch(0.704 0.191 22.216)",
  destructiveForeground: "oklch(0.985 0 0)",
  border: "oklch(1 0 0 / 10%)",
  input: "oklch(1 0 0 / 15%)",
  ring: "oklch(0.556 0 0)",
};

export const storeConfig: StoreConfig = {
  name: "NEWFOC",
  shortName: "NEWFOC",
  tagline: "Importadora de electrodomésticos y tecnología",
  description:
    "NEWFOC es una importadora de electrodomésticos y tecnología. Encontrá cafeteras, licuadoras, wafleras, freidoras de aire, Smart TV, heladeras, lavarropas y mucho más.",
  locale: "es_AR",
  contact: {
    phone: "+54 11 2851-2434",
    // Más adelante podés agregar:
    // email: "contacto@newfoc.com",
    // address: "Buenos Aires, Argentina",
    // instagram: "newfoc",
    // facebook: "https://facebook.com/newfoc",
  },
  theme: {
    light: DEMO_LIGHT,
    dark: DEMO_DARK,
    radius: "0.625rem",
  },
};
