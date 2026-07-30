/**
 * Iconos disponibles para el bloque CATEGORY_GRID del CMS.
 *
 * Mapa slug → componente lucide. El slug se guarda en `Category.icon`
 * (string nullable). El admin elige uno de la lista; si no eligió,
 * fallback a `Package`.
 *
 * Para sumar un icono: importarlo de lucide-react y agregarlo al
 * registro con un slug en kebab-case. El label es lo que el admin ve
 * en el selector.
 */
import {
  type LucideIcon,
  Baby,
  Bike,
  Book,
  Camera,
  Car,
  Coffee,
  Drill,
  Dumbbell,
  Flower,
  Gamepad2,
  Headphones,
  Heart,
  Home,
  Laptop,
  Microwave,
  Package,
  Palette,
  PawPrint,
  Pizza,
  Refrigerator,
  Shirt,
  Smartphone,
  Sofa,
  Sparkles,
  Star,
  Tag,
  Tv,
  Utensils,
  Watch,
  WashingMachine,
  Wrench,
  Zap,
} from "lucide-react";

interface CategoryIconDef {
  slug: string;
  label: string;
  Icon: LucideIcon;
}

/** Registro curado — orden alfabético por label, así el selector queda prolijo. */
export const CATEGORY_ICONS: readonly CategoryIconDef[] = [
  { slug: "baby", label: "Bebés", Icon: Baby },
  { slug: "bike", label: "Bicicletas", Icon: Bike },
  { slug: "book", label: "Libros", Icon: Book },
  { slug: "camera", label: "Cámaras", Icon: Camera },
  { slug: "car", label: "Autos", Icon: Car },
  { slug: "coffee", label: "Café", Icon: Coffee },
  { slug: "drill", label: "Herramientas", Icon: Drill },
  { slug: "dumbbell", label: "Deportes", Icon: Dumbbell },
  { slug: "electro", label: "Electro", Icon: Zap },
  { slug: "flower", label: "Plantas / Jardín", Icon: Flower },
  { slug: "gamepad", label: "Gaming", Icon: Gamepad2 },
  { slug: "headphones", label: "Audio", Icon: Headphones },
  { slug: "heart", label: "Favoritos", Icon: Heart },
  { slug: "home", label: "Hogar", Icon: Home },
  { slug: "laptop", label: "Notebooks", Icon: Laptop },
  { slug: "microwave", label: "Microondas", Icon: Microwave },
  { slug: "palette", label: "Arte", Icon: Palette },
  { slug: "paw", label: "Mascotas", Icon: PawPrint },
  { slug: "pizza", label: "Comida", Icon: Pizza },
  { slug: "refrigerator", label: "Heladeras", Icon: Refrigerator },
  { slug: "shirt", label: "Ropa", Icon: Shirt },
  { slug: "smartphone", label: "Celulares", Icon: Smartphone },
  { slug: "sofa", label: "Muebles", Icon: Sofa },
  { slug: "sparkles", label: "Belleza", Icon: Sparkles },
  { slug: "star", label: "Destacados", Icon: Star },
  { slug: "tag", label: "Ofertas", Icon: Tag },
  { slug: "tv", label: "TV", Icon: Tv },
  { slug: "utensils", label: "Cocina", Icon: Utensils },
  { slug: "washing-machine", label: "Lavarropas", Icon: WashingMachine },
  { slug: "watch", label: "Relojes", Icon: Watch },
  { slug: "wrench", label: "Reparación", Icon: Wrench },
];

const ICON_BY_SLUG = new Map(CATEGORY_ICONS.map((def) => [def.slug, def.Icon]));

/**
 * Resuelve el componente lucide para un slug. Si no existe o es null,
 * devuelve `Package` (genérico) — el render nunca queda vacío.
 */
export function resolveCategoryIcon(slug: string | null | undefined): LucideIcon {
  if (!slug) return Package;
  return ICON_BY_SLUG.get(slug) ?? Package;
}
