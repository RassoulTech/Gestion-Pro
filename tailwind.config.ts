/**
 * Tailwind v4 — Ce fichier N'EST PAS chargé par défaut.
 * Toute la configuration vit dans `src/app/globals.css` via `@theme`.
 *
 * Conservé pour :
 *  - prettier-plugin-tailwindcss (détection automatique des classes)
 *  - extensions IDE (VSCode Tailwind IntelliSense)
 *
 * Pour le charger explicitement, ajouter dans globals.css :
 *   @config "../../tailwind.config.ts";
 * (non recommandé : on perdrait les bénéfices de @theme natif)
 */
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx,mdx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}",
  ],
};

export default config;
