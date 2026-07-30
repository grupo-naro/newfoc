import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SITE_URL } from "@/core/lib/seo";
import { ThemeStyle } from "@/core/theme/theme-style";
import { storeConfig } from "@/store.config";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata por defecto del framework. Cada página la extiende; la
// identidad concreta (nombre/descripción/locale) sale de `store.config.ts`.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: storeConfig.name,
    template: `%s · ${storeConfig.name}`,
  },
  description: storeConfig.description,
  openGraph: {
    type: "website",
    siteName: storeConfig.name,
    locale: storeConfig.locale,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <head>
        <ThemeStyle />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
