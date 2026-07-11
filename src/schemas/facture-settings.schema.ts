import { z } from "zod";

/**
 * Personnalisation de la facture d'une boutique (Boutique.factureSettings, jsonb).
 * Null/absent = défauts de la marque. Toutes les valeurs sont optionnelles et
 * bornées — le gabarit PDF applique `parseFactureSettings` pour obtenir des
 * défauts sûrs quel que soit le contenu stocké.
 */
export const factureSettingsSchema = z.object({
  /** Couleur d'accent (en-tête « FACTURE », total) — hex #RRGGBB. */
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide (format #RRGGBB)")
    .optional(),
  /** Coordonnées de la boutique affichées dans l'en-tête. */
  showTelephone: z.boolean().optional(),
  showEmail: z.boolean().optional(),
  showAdresse: z.boolean().optional(),
  /** Message de remerciement (pied de page). */
  merci: z.string().max(160, "160 caractères maximum").optional(),
  /** Mentions personnalisées (légales, conditions, RC/NINEA…) — pied de page. */
  mentions: z.string().max(300, "300 caractères maximum").optional(),
  /**
   * Police du document. Polices STANDARD PDF (rendu garanti identique sur tout
   * appareil/lecteur, sans embarquement de fichier) :
   * helvetica = moderne sans-serif · times = classique à empattements ·
   * courier = neutre à chasse fixe.
   */
  font: z.enum(["helvetica", "times", "courier"]).optional(),
});

export type FactureSettingsInput = z.infer<typeof factureSettingsSchema>;

/** Réglages résolus (défauts appliqués) — consommés par le gabarit PDF. */
export type FactureFont = "helvetica" | "times" | "courier";

export interface FactureSettings {
  accentColor: string;
  showTelephone: boolean;
  showEmail: boolean;
  showAdresse: boolean;
  merci: string;
  mentions: string | null;
  font: FactureFont;
}

export const FACTURE_SETTINGS_DEFAULTS: FactureSettings = {
  accentColor: "#EA580C", // orange de marque
  showTelephone: true,
  showEmail: true,
  showAdresse: true,
  merci: "Merci pour votre confiance ! Pour toute question, contactez notre support.",
  mentions: null,
  font: "helvetica",
};

/**
 * Parse tolérant du jsonb stocké : valeurs invalides/inconnues ignorées,
 * défauts appliqués. Ne jette JAMAIS (une facture doit toujours se générer).
 */
export function parseFactureSettings(raw: unknown): FactureSettings {
  const parsed = factureSettingsSchema.safeParse(raw ?? {});
  const s = parsed.success ? parsed.data : {};
  return {
    accentColor: s.accentColor ?? FACTURE_SETTINGS_DEFAULTS.accentColor,
    showTelephone: s.showTelephone ?? FACTURE_SETTINGS_DEFAULTS.showTelephone,
    showEmail: s.showEmail ?? FACTURE_SETTINGS_DEFAULTS.showEmail,
    showAdresse: s.showAdresse ?? FACTURE_SETTINGS_DEFAULTS.showAdresse,
    merci: (s.merci ?? "").trim() || FACTURE_SETTINGS_DEFAULTS.merci,
    mentions: (s.mentions ?? "").trim() || null,
    font: s.font ?? FACTURE_SETTINGS_DEFAULTS.font,
  };
}
