/**
 * Configuration i18n centrale (next-intl, sans préfixe d'URL).
 *
 * Ajouter une langue = ajouter son code ici + le fichier
 * `src/messages/<code>.json`. Aucune URL/route n'est impactée : la langue est
 * persistée dans un cookie, jamais dans le chemin.
 */
export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

/** Nom natif affiché dans le sélecteur de langue. */
export const localeNames: Record<Locale, string> = {
  fr: "Français",
  en: "English",
};

/** Drapeau (emoji) indicatif — purement décoratif. */
export const localeFlags: Record<Locale, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
};

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
