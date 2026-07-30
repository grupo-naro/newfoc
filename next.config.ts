import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fijamos la raíz del proyecto: hay lockfiles fuera de /web que
  // hacían que Turbopack infiriera mal el workspace root.
  turbopack: {
    root: __dirname,
  },
  // Las imágenes se sirven vía el loader de Cloudinary (StoreImage),
  // que evita el optimizador de Next — no hace falta `remotePatterns`.
};

// Bundle analyzer (M7.4) — `ANALYZE=true pnpm build` abre el reporte
// en el browser; sin la env var es no-op.
export default bundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(
  nextConfig,
);
