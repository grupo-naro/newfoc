/**
 * Barra de anuncios del storefront — vive en el layout, arriba del
 * header, en todas las páginas. NO es sticky: scrollea con la página.
 *
 * Los mensajes se editan desde el bloque CMS tipo ANNOUNCEMENT_BAR.
 * Si no hay ninguno activo, no renderiza nada.
 */
import { getAnnouncementBar } from "@/core/modules/cms";

export async function AnnouncementBar() {
  const block = await getAnnouncementBar();
  if (!block) return null;

  return (
    <div className="bg-[oklch(0.5_0.22_260)] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2 text-center text-xs font-medium sm:text-sm">
        <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {block.data.messages.map((message, index) => (
            <li key={index} className="flex items-center gap-3">
              {index > 0 && (
                <span aria-hidden="true" className="text-white/50">
                  •
                </span>
              )}
              {message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
