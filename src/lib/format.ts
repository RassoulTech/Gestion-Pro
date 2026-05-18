/**
 * Helpers de formatage — locale FR par défaut.
 *
 * @example
 *   formatPrice(12500)              → "12 500 F CFA"
 *   formatPrice(1234.56, "EUR")     → "1 234,56 €"
 *   formatPrice(1234.56, "USD")     → "1 234,56 $US"
 *   formatDate(new Date())          → "14 mai 2026"
 *   formatDate(d, { dateStyle: "full" })
 *                                   → "mercredi 14 mai 2026"
 *   formatNumber(1234567)           → "1 234 567"
 *   formatRelativeTime(date)        → "il y a 3 minutes"
 */

export type Currency = "XOF" | "EUR" | "USD";

const DEFAULT_LOCALE = "fr-FR";

/**
 * Formate un montant en devise. XOF n'a pas de décimales, EUR/USD en ont 2.
 */
export function formatPrice(
  amount: number,
  currency: Currency = "XOF",
  locale: string = DEFAULT_LOCALE
): string {
  const isFCFA = currency === "XOF";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: isFCFA ? 0 : 2,
    maximumFractionDigits: isFCFA ? 0 : 2,
  }).format(amount);
}

/**
 * Alias rétrocompatible — privilégier `formatPrice` dans le code nouveau.
 */
export function formatCurrency(
  amount: number,
  currency: Currency = "XOF"
): string {
  return formatPrice(amount, currency);
}

/**
 * Formate une date — defaults sur dateStyle "medium" (ex: "14 mai 2026").
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
  locale: string = DEFAULT_LOCALE
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
}

/**
 * Formate une date + heure (ex: "14 mai 2026, 14:30").
 */
export function formatDateTime(
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

/**
 * Formate un nombre — séparateur espace insécable tous les 3 chiffres.
 */
export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {},
  locale: string = DEFAULT_LOCALE
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Formate un pourcentage : 0.123 → "12 %".
 * Passer `fraction` à false si la valeur est déjà en base 100.
 */
export function formatPercent(
  value: number,
  options: {
    fraction?: boolean;
    maximumFractionDigits?: number;
  } = {}
): string {
  const { fraction = true, maximumFractionDigits = 1 } = options;
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "percent",
    maximumFractionDigits,
  }).format(fraction ? value : value / 100);
}

/**
 * Temps relatif sémantique ("il y a 3 minutes", "dans 2 jours").
 * Auto-sélection de l'unité la plus pertinente.
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE
): string {
  const target = new Date(date).getTime();
  const now = Date.now();
  const diffSeconds = Math.round((target - now) / 1000);
  const abs = Math.abs(diffSeconds);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const thresholds: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [604800, "day"],
    [2629800, "week"], // ~30.44 jours / 7
    [31557600, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];

  const divisors: Record<Intl.RelativeTimeFormatUnit, number> = {
    second: 1,
    seconds: 1,
    minute: 60,
    minutes: 60,
    hour: 3600,
    hours: 3600,
    day: 86400,
    days: 86400,
    week: 604800,
    weeks: 604800,
    month: 2629800,
    months: 2629800,
    quarter: 7889400,
    quarters: 7889400,
    year: 31557600,
    years: 31557600,
  };

  for (const [limit, unit] of thresholds) {
    if (abs < limit) {
      const value = Math.round(diffSeconds / divisors[unit]);
      return rtf.format(value, unit);
    }
  }
  return rtf.format(Math.round(diffSeconds / divisors.year), "year");
}

/**
 * Tronque un texte sans couper un mot, ajoute "…" si nécessaire.
 */
export function formatTruncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max).split(" ");
  cut.pop();
  return cut.join(" ") + "…";
}

/**
 * Formate un numéro de téléphone international en groupes lisibles.
 * Fallback simple : on garde tel quel si le format n'est pas reconnu.
 * Pour validation/parsing avancé : utiliser libphonenumber dans le PhoneField (Phase 7).
 */
export function formatPhone(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, "");
  // Sénégal / CI / Mali : +XXX XX XXX XX XX
  const match = cleaned.match(/^(\+\d{1,3})(\d{2})(\d{3})(\d{2})(\d{2})$/);
  if (match) return `${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
  return raw;
}
