import { z } from "zod";

/** Motifs proposés selon le public (libellés FR affichés dans le widget). */
export const MOTIFS_VISITEUR = [
  { value: "INFOS", label: "Informations sur l'app" },
  { value: "ACCES", label: "Problème d'inscription / d'accès" },
  { value: "QUESTION", label: "Question" },
  { value: "AUTRE", label: "Autre" },
] as const;

export const MOTIFS_VENDEUR = [
  { value: "PROBLEME", label: "Problème technique" },
  { value: "QUESTION", label: "Question" },
  { value: "SUGGESTION", label: "Suggestion de fonctionnalité" },
  { value: "AUTRE", label: "Autre" },
] as const;

export const MOTIF_LABELS: Record<string, string> = Object.fromEntries(
  [...MOTIFS_VISITEUR, ...MOTIFS_VENDEUR].map((m) => [m.value, m.label])
);

/**
 * Entrée du point public. `website` = champ PIÈGE (honeypot) invisible :
 * tout contenu ⇒ bot. Identité vendeur dérivée de la SESSION côté serveur —
 * les champs nom/email/telephone ne sont exigés que pour un visiteur.
 */
export const submitSupportSchema = z.object({
  nom: z.string().trim().max(80, "Nom trop long").optional(),
  email: z.string().trim().email("E-mail invalide").max(254).optional(),
  telephone: z.string().trim().max(25, "Numéro trop long").optional(),
  motif: z.enum(["INFOS", "ACCES", "QUESTION", "PROBLEME", "SUGGESTION", "AUTRE"]),
  message: z
    .string()
    .trim()
    .min(10, "Votre message est trop court (10 caractères minimum).")
    .max(2000, "Message trop long (2000 caractères maximum)."),
  /** Contexte facultatif envoyé par le widget vendeur (vérifié côté serveur). */
  boutiqueId: z.string().max(40).optional(),
  /** Honeypot — doit rester vide. */
  website: z.string().max(0, "Spam détecté.").optional().or(z.literal("")),
});

export type SubmitSupportInput = z.infer<typeof submitSupportSchema>;
