import type { PeriodKey } from "@/lib/periods";

/**
 * FILTRE GLOBAL DE SESSION — un seul mécanisme pour toute l'app.
 *
 * La période choisie sur un DASHBOARD (vendeur ou admin) est écrite dans le
 * cookie `gp_filtre` (non httpOnly → posé côté client, lu côté serveur).
 * Sur chaque page, la résolution suit TOUJOURS l'ordre :
 *   1. paramètres d'URL (réglage LOCAL de la page) ;
 *   2. cookie global (posé par le dashboard) ;
 *   3. défaut de la page.
 * Le cookie étant par navigateur, chacun (vendeur, admin) a le sien.
 *
 * Valeur du cookie : clé canonique (`30j`, `6mois`…) ou `perso|<du>|<au>`
 * (dates ISO yyyy-MM-dd).
 */
// ÉTANCHÉITÉ entre espaces : le global VENDEUR ne touche que l'espace vendeur,
// le global ADMIN que l'espace admin (deux cookies distincts).
export const GLOBAL_FILTER_COOKIE_VENDOR = "gp_filtre_v";
export const GLOBAL_FILTER_COOKIE_ADMIN = "gp_filtre_a";
/** Alias historique (espace vendeur). */
export const GLOBAL_FILTER_COOKIE = GLOBAL_FILTER_COOKIE_VENDOR;

export interface GlobalFilterValue {
  p: PeriodKey;
  du?: string;
  au?: string;
}

const CANONICAL_KEYS: PeriodKey[] = [
  "aujourdhui", "hier", "7j", "30j", "mois", "6mois", "annee", "perso",
];

export function serializeGlobalFilter(v: GlobalFilterValue): string {
  return v.p === "perso" && v.du && v.au ? `perso|${v.du}|${v.au}` : v.p;
}

export function parseGlobalFilterCookie(
  raw: string | undefined
): GlobalFilterValue | null {
  if (!raw) return null;
  const [p, du, au] = raw.split("|");
  if (!CANONICAL_KEYS.includes(p as PeriodKey)) return null;
  if (p === "perso") {
    const ok = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
    return ok(du) && ok(au) ? { p: "perso", du, au } : null;
  }
  return { p: p as PeriodKey };
}

/** Chaîne `document.cookie` à poser côté client (1 an). */
export function globalFilterCookieString(v: GlobalFilterValue): string {
  return `${GLOBAL_FILTER_COOKIE_ADMIN}=${encodeURIComponent(serializeGlobalFilter(v))}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

/** Provenance du filtre appliqué (pour le badge discret). */
export type FilterSource = "local" | "global" | "defaut";

/**
 * Résolution canonique (pages admin) : URL > cookie global > défaut.
 * Renvoie les paramètres à passer à `resolvePeriod` + la provenance.
 */
export function resolveCanonicalParams(
  sp: { p?: string; du?: string; au?: string },
  cookieRaw: string | undefined,
  defaultKey: PeriodKey = "30j"
): { p: string; du?: string; au?: string; source: FilterSource } {
  if (sp.p) return { p: sp.p, du: sp.du, au: sp.au, source: "local" };
  const g = parseGlobalFilterCookie(cookieRaw);
  if (g) return { p: g.p, du: g.du, au: g.au, source: "global" };
  return { p: defaultKey, source: "defaut" };
}

/** Canonique → dialecte vendeur (`parseDateFilter`). Couverture 1:1. */
export const CANONICAL_TO_VENDOR: Record<Exclude<PeriodKey, "perso">, string> = {
  aujourdhui: "today",
  hier: "yesterday",
  "7j": "7days",
  "30j": "30days",
  mois: "thismonth",
  "6mois": "6months",
  annee: "thisyear",
};

/** Dialecte vendeur → canonique (écriture du global depuis le dashboard vendeur). */
export const VENDOR_TO_CANONICAL: Record<string, PeriodKey> = Object.fromEntries(
  Object.entries(CANONICAL_TO_VENDOR).map(([c, v]) => [v, c as PeriodKey])
);

/** Presets vendeur SANS équivalent canonique (stockés tels quels dans le cookie). */
const VENDOR_ONLY_KEYS = ["3days", "15days", "lastmonth", "3months", "all"];

/**
 * Cookie global → clé du dialecte VENDEUR (`parseDateFilter`), quel que soit
 * le dashboard qui l'a posé. `perso|du|au` → custom + dates.
 */
export function globalCookieToVendorRange(
  raw: string | undefined
): { range: string; from?: string; to?: string } | null {
  if (!raw) return null;
  const g = parseGlobalFilterCookie(raw);
  if (g) {
    return g.p === "perso"
      ? { range: "custom", from: g.du, to: g.au }
      : { range: CANONICAL_TO_VENDOR[g.p] };
  }
  // Clé vendeur pure (posée par le dashboard vendeur : 3 jours, 15 jours…).
  if (VENDOR_ONLY_KEYS.includes(raw) || raw in VENDOR_TO_CANONICAL) {
    return { range: raw };
  }
  return null;
}

/** Écriture du global depuis le dashboard VENDEUR (clé vendeur ou plage perso). */
export function vendorGlobalCookieString(range: string, from?: string, to?: string): string {
  const value =
    range === "custom" && from && to
      ? `perso|${from}|${to}`
      : (VENDOR_TO_CANONICAL[range] ?? range);
  return `${GLOBAL_FILTER_COOKIE_VENDOR}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}
