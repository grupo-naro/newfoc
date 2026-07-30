/**
 * Sube un archivo DIRECTO a Cloudinary usando una firma del server.
 *
 * Compartido entre los uploaders del panel (productos, banners, etc.).
 * El navegador es quien envía el archivo; el `api_secret` nunca sale
 * del server (vive en `getUploadSignature`).
 */
import { getUploadSignature } from "@/core/integrations/cloudinary/upload";

/** Sube `file` a Cloudinary y devuelve su `public_id`. */
export async function uploadToCloudinary(file: File): Promise<string> {
  const sig = await getUploadSignature();

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sig.apiKey);
  body.append("timestamp", String(sig.timestamp));
  body.append("folder", sig.folder);
  body.append("signature", sig.signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: "POST", body },
  );
  if (!response.ok) {
    throw new Error("Cloudinary rechazó la subida");
  }
  const json = (await response.json()) as { public_id: string };
  return json.public_id;
}
