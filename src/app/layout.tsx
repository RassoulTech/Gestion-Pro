import type { Metadata } from "next";
import {
  Geist_Mono,
  Bricolage_Grotesque,
  Plus_Jakarta_Sans,
} from "next/font/google";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { auth } from "@/lib/auth";
import "./globals.css";

// ⚡ Perf : Inter et Geist (sans) ont été retirées — elles n'étaient JAMAIS
// affichées (simples fallbacks derrière Jakarta/Bricolage qui se chargent toujours)
// mais étaient préchargées sur chaque page (2 familles de polices inutiles).
// Mono : réservée au code / identifiants (absente de la landing et de la plupart
// des pages). `preload: false` → elle n'est plus préchargée sur le chemin critique ;
// elle se charge à la demande là où du texte mono est réellement affiché.
const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
  preload: false,
});

// Police d'affichage à fort caractère pour les titres (éditoriale, premium).
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
});

// Police de corps premium & professionnelle (UI, paragraphes) — tout le projet.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: {
    default: "GestionPro — Gestion commerciale multi-boutiques",
    template: "%s | GestionPro",
  },
  description:
    "Plateforme SaaS de gestion commerciale, POS et marketplace multi-boutiques.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  // iOS : permet l'ouverture en plein écran depuis l'écran d'accueil + titre.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GestionPro",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ⚡ Perf : exécutés sur CHAQUE requête → en parallèle (avant : 3 await en série).
  const [session, locale, messages] = await Promise.all([
    auth(),
    getLocale(),
    getMessages(),
  ]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${jakarta.variable} ${geistMono.variable} ${bricolage.variable} font-sans`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers session={session}>
            {children}
            <Toaster richColors position="top-right" />
          </Providers>
        </NextIntlClientProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
