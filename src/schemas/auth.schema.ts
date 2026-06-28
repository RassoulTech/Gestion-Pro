import { z } from "zod";
import { isDisposableEmail } from "@/lib/disposable-emails";

// Normalise l'email (trim + minuscules) AVANT validation, de façon cohérente
// entre connexion, inscription et reset. Évite les comptes inaccessibles à cause
// d'une casse différente (l'email est stocké en minuscules à l'inscription).
const normalizedEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email("Email invalide");

// Email d'inscription : normalisé + refus des adresses jetables.
const realEmail = normalizedEmail.refine((email) => !isDisposableEmail(email), {
  message:
    "Les adresses email jetables ne sont pas autorisées. Utilisez une adresse permanente.",
});

// Politique de complexité partagée entre inscription ET réinitialisation, afin
// qu'un reset ne puisse pas contourner les exigences de l'inscription.
const strongPassword = z
  .string()
  .min(8, "Le mot de passe doit faire au moins 8 caractères")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
  );

export const loginSchema = z.object({
  email: normalizedEmail,
  password: z.string().min(1, "Mot de passe requis"),
});

// ⚠️ SECURITY: role is NOT included — set only via admin action
export const registerSchema = z
  .object({
    name: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
    email: realEmail,
    password: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

// ─── Inscription vendeur en 3 étapes (Compte → Identité → Boutique) ──────────

const secteurActivite = z.enum([
  "ALIMENTATION",
  "HABILLEMENT",
  "ELECTRONIQUE",
  "BEAUTE",
  "SANTE",
  "SERVICES",
  "QUINCAILLERIE",
  "LIBRAIRIE",
  "AUTRE",
]);

// Champs réutilisés entre la validation client (par étape) et la soumission
// finale serveur, pour garantir des règles identiques des deux côtés.
const identityShape = {
  prenom: z.string().trim().min(2, "Le prénom doit faire au moins 2 caractères").max(60),
  nom: z.string().trim().min(2, "Le nom doit faire au moins 2 caractères").max(60),
  telephone: z.string().trim().max(20).optional().or(z.literal("")),
};

const boutiqueShape = {
  boutiqueNom: z
    .string()
    .trim()
    .min(2, "Le nom de la boutique doit faire au moins 2 caractères")
    .max(100),
  secteurActivite,
  boutiqueAdresse: z.string().trim().max(200).optional().or(z.literal("")),
  boutiqueTelephone: z.string().trim().max(20).optional().or(z.literal("")),
};

/** Étape 1 — Compte (validation client). */
export const registerAccountSchema = z
  .object({
    email: realEmail,
    password: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

/** Étape 2 — Identité (validation client). */
export const registerIdentitySchema = z.object(identityShape);

/** Étape 3 — Boutique (validation client). */
export const registerBoutiqueSchema = z.object(boutiqueShape);

/** Soumission finale (serveur) — tous les champs des 3 étapes. */
export const submitVendorRegistrationSchema = z.object({
  email: realEmail,
  password: strongPassword,
  ...identityShape,
  ...boutiqueShape,
});

/** Complétion après connexion Google (User déjà créé) — identité + boutique. */
export const completeOAuthRegistrationSchema = z.object({
  ...identityShape,
  ...boutiqueShape,
});

export type RegisterAccountInput = z.infer<typeof registerAccountSchema>;
export type RegisterIdentityInput = z.infer<typeof registerIdentitySchema>;
export type RegisterBoutiqueInput = z.infer<typeof registerBoutiqueSchema>;
export type SubmitVendorRegistrationInput = z.infer<typeof submitVendorRegistrationSchema>;
export type CompleteOAuthRegistrationInput = z.infer<typeof completeOAuthRegistrationSchema>;

export const forgotPasswordSchema = z.object({
  email: normalizedEmail,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Jeton requis"),
    password: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
