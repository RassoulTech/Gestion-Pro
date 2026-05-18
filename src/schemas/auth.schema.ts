import { z } from "zod";
import { isDisposableEmail } from "@/lib/disposable-emails";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

const realEmail = z
  .string()
  .email("Email invalide")
  .transform((v) => v.toLowerCase().trim())
  .refine((email) => !isDisposableEmail(email), {
    message: "Les adresses email jetables ne sont pas autorisées. Utilisez une adresse permanente.",
  });

// ⚠️ SECURITY: role is NOT included — set only via admin action
export const registerSchema = z
  .object({
    name: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
    email: realEmail,
    password: z
      .string()
      .min(8, "Le mot de passe doit faire au moins 8 caractères")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string(),
    password: z
      .string()
      .min(8, "Le mot de passe doit faire au moins 8 caractères"),
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
