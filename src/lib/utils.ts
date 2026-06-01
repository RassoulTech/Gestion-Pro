import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Concatène des classes Tailwind en résolvant les conflits.
 * @example cn("px-2 py-1", isActive && "bg-brand", className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/* ─────────────────────────────────────────────────────────────────────
 * Re-exports rétrocompatibles.
 * Le code nouveau doit importer directement depuis `@/lib/format`.
 * ───────────────────────────────────────────────────────────────────── */
export {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatPhone,
  formatPrice,
  formatRelativeTime,
  formatTruncate,
} from "./format";

/* ─────────────────────────────────────────────────────────────────────
 * Helpers chaîne — usage utilitaire général.
 * ───────────────────────────────────────────────────────────────────── */

/**
 * Slugifie une chaîne : minuscule, sans accents, alphanum + tirets.
 * @example slugify("Diallo Électronique") → "diallo-electronique"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Initiales d'un nom — 2 caractères max, en majuscules.
 * @example getInitials("Amadou Diallo") → "AD"
 */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Génère un code unique préfixé (timestamp base36 + suffixe aléatoire).
 * @example generateCode("CMD") → "CMD-LZQ1JK-A7B2"
 */
export function generateCode(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Traduit et formate le secteur d'activité de la boutique avec son émoji.
 * @example getSectorLabel("ALIMENTATION") → "🍔 Restauration & Alimentation"
 */
export function getSectorLabel(sector: string | null): string {
  if (!sector) return "📦 Autre activité";
  switch (sector.toUpperCase()) {
    case "ALIMENTATION":
      return "🍔 Restauration & Alimentation";
    case "HABILLEMENT":
      return "👕 Mode & Vêtements";
    case "ELECTRONIQUE":
      return "💻 Technologie & Téléphonie";
    case "BEAUTE":
      return "💄 Beauté & Cosmétique";
    case "SANTE":
      return "🏥 Santé & Bien-être";
    case "SERVICES":
      return "🏪 Commerce & Services";
    case "QUINCAILLERIE":
      return "🏗️ Construction & Quincaillerie";
    case "LIBRAIRIE":
      return "📚 Éducation & Librairie";
    default:
      return "📦 Autre activité";
  }
}

