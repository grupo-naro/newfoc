/**
 * Tipos de dominio del CMS.
 *
 * `HomeBlock` es una unión discriminada por `type`: el renderer hace
 * `switch` sobre `type` y TypeScript estrecha `data` al shape correcto.
 */
import type {
  AnnouncementBarData,
  BlockFormValues,
  CategoryGridData,
  HeroBannerData,
  HomeBlockType,
  OffersCarouselData,
  ProductCarouselData,
} from "./cms.schemas";

interface BaseBlock {
  id: string;
  sortOrder: number;
}

export type HomeBlock =
  | (BaseBlock & { type: "HERO_BANNER"; data: HeroBannerData })
  | (BaseBlock & { type: "PRODUCT_CAROUSEL"; data: ProductCarouselData })
  | (BaseBlock & { type: "CATEGORY_GRID"; data: CategoryGridData })
  | (BaseBlock & { type: "ANNOUNCEMENT_BAR"; data: AnnouncementBarData })
  | (BaseBlock & { type: "OFFERS_CAROUSEL"; data: OffersCarouselData });

/** Fila del listado del editor de bloques (panel admin). */
export interface HomeBlockListItem {
  id: string;
  type: HomeBlockType;
  isActive: boolean;
  /** Descripción de una línea para el listado. */
  summary: string;
}

/** Bloque cargado para editar — tipo + valores del formulario. */
export interface HomeBlockForEdit {
  id: string;
  type: HomeBlockType;
  values: BlockFormValues;
}
