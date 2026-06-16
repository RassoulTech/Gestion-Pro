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
