import type { MetadataRoute } from "next";

// Manifest PWA — rend l'app installable sur l'écran d'accueil (Android/iOS/desktop).
// Le mode hors-ligne (service worker + file d'attente POS) est un chantier séparé.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GestionPro — Gestion commerciale",
    short_name: "GestionPro",
    description:
      "Gestion commerciale multi-boutiques : caisse (POS), stock, commandes, facturation et marketplace.",
    lang: "fr",
    start_url: "/boutiques",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#ea580c",
    icons: [
      {
        src: "/icons/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
