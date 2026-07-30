"use server";

/**
 * Upload firmado a Cloudinary (M3.3c).
 *
 * El navegador sube el archivo DIRECTO a Cloudinary — el server sólo
 * firma los parámetros con el `api_secret` (que nunca sale del
 * server). Esta acción se invoca desde el panel admin, así que queda
 * detrás del proxy que protege `/admin/*`.
 *
 * Cloudinary firma con: sha1 de los parámetros ordenados como
 * `clave=valor` unidos por `&`, con el `api_secret` al final.
 */
import { createHash } from "node:crypto";

import { CLOUDINARY_CLOUD_NAME } from "./config";

const API_KEY = process.env.CLOUDINARY_API_KEY ?? "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "";
const UPLOAD_FOLDER = process.env.CLOUDINARY_UPLOAD_FOLDER || "commerce-core";

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

/** Firma los parámetros de un upload. Lanza si falta configuración. */
export async function getUploadSignature(): Promise<UploadSignature> {
  if (!CLOUDINARY_CLOUD_NAME || !API_KEY || !API_SECRET) {
    throw new Error(
      "Cloudinary no está configurado — faltan CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.",
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `folder=${UPLOAD_FOLDER}&timestamp=${timestamp}`;
  const signature = createHash("sha1")
    .update(toSign + API_SECRET)
    .digest("hex");

  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: API_KEY,
    timestamp,
    folder: UPLOAD_FOLDER,
    signature,
  };
}
