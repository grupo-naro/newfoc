/**
 * Use cases del CMS.
 *
 * `getHomeBlocks` lee los bloques activos y valida la `data` de cada
 * uno contra el schema de su tipo. Un bloque con `data` inválida se
 * OMITE — un bloque mal configurado no debe romper la home.
 *
 * `ANNOUNCEMENT_BAR` se filtra de la home (vive en el layout) y se
 * expone aparte vía `getAnnouncementBar`.
 */
import { HOME_BLOCK_SCHEMAS } from "./cms.schemas";
import * as repo from "./cms.repository";
import type { HomeBlock } from "./cms.types";

type AnnouncementBarBlock = Extract<HomeBlock, { type: "ANNOUNCEMENT_BAR" }>;

/**
 * Bloques de la home, validados y listos para renderizar. En modo
 * `preview` (sólo para el admin) se incluyen los programados a futuro.
 * Excluye `ANNOUNCEMENT_BAR` — ese se renderiza en el layout.
 */
export async function getHomeBlocks(preview = false): Promise<HomeBlock[]> {
  const rows = await repo.listActiveBlocks(preview);

  const blocks: HomeBlock[] = [];
  for (const row of rows) {
    if (row.type === "ANNOUNCEMENT_BAR") continue;

    const schema = HOME_BLOCK_SCHEMAS[row.type];
    const parsed = schema.safeParse(row.data);
    if (!parsed.success) continue;

    blocks.push({
      id: row.id,
      type: row.type,
      sortOrder: row.sortOrder,
      data: parsed.data,
    } as HomeBlock);
  }
  return blocks;
}

/**
 * Primer `ANNOUNCEMENT_BAR` activo y dentro de su ventana de visibilidad.
 * Devuelve `null` si no hay ninguno configurado — el layout no renderiza
 * la barra en ese caso.
 */
export async function getAnnouncementBar(): Promise<AnnouncementBarBlock | null> {
  const rows = await repo.listActiveBlocks(false);
  for (const row of rows) {
    if (row.type !== "ANNOUNCEMENT_BAR") continue;
    const parsed = HOME_BLOCK_SCHEMAS.ANNOUNCEMENT_BAR.safeParse(row.data);
    if (!parsed.success) continue;
    return {
      id: row.id,
      type: "ANNOUNCEMENT_BAR",
      sortOrder: row.sortOrder,
      data: parsed.data,
    };
  }
  return null;
}
