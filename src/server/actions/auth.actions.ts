"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { actionClient, authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { authRatelimit } from "@/lib/ratelimit";
import { logActivity } from "@/lib/activity-log";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@/schemas/auth.schema";
import { createVendeurProfileSchema } from "@/schemas/vendeur.schema";

import { z } from "zod";
import { generateVerificationToken, generatePasswordResetToken } from "@/lib/tokens";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/mail";

export const registerUser = actionClient
  .schema(registerSchema)
  .action(async ({ parsedInput }) => {
    const ip = (await headers()).get("x-forwarded-for") ?? "127.0.0.1";
    const { success } = await authRatelimit.limit(ip);

    if (!success) {
      throw new Error("Trop de tentatives. Veuillez réessayer dans une minute.");
    }

    const { name, email, password } = parsedInput;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error("Un compte avec cet email existe déjà.");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // ⚠️ SECURITY: emailVerified is null initially
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "CLIENT",
      },
    });

    const verificationToken = await generateVerificationToken(email);
    const mail = await sendVerificationEmail(
      verificationToken.identifier,
      verificationToken.token
    );

    if (!mail.sent && process.env.NODE_ENV === "production" && !mail.devLink) {
      // In prod, SMTP failed and there's no dev link to fall back on. Tell the
      // user clearly instead of pretending the email is on its way.
      console.error("[register] verification email failed:", mail.error);
      throw new Error(
        "Votre compte est créé, mais l'envoi de l'email de vérification a échoué (passerelle SMTP indisponible). Utilisez « Renvoyer l'email » dans quelques minutes ou contactez le support."
      );
    }

    return {
      success: mail.sent
        ? "Email de vérification envoyé !"
        : "Compte créé. Email de vérification disponible via le lien de dev ci-dessous.",
      devLink: mail.devLink,
    };
  });

export const resendVerificationEmail = actionClient
  .schema(z.object({ email: z.string().email("Email invalide") }))
  .action(async ({ parsedInput }) => {
    const ip = (await headers()).get("x-forwarded-for") ?? "127.0.0.1";
    const { success } = await authRatelimit.limit(ip);

    if (!success) {
      throw new Error("Trop de tentatives. Veuillez réessayer dans une minute.");
    }

    const { email } = parsedInput;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    // Réponse générique pour éviter l'énumération d'emails
    if (!existingUser || existingUser.emailVerified) {
      return { success: "Si un compte non vérifié existe avec cet email, un nouveau lien vient d'être envoyé." };
    }

    const verificationToken = await generateVerificationToken(email);
    const mail = await sendVerificationEmail(
      verificationToken.identifier,
      verificationToken.token
    );

    return {
      success: "Si un compte non vérifié existe avec cet email, un nouveau lien vient d'être envoyé.",
      devLink: mail.devLink,
    };
  });

/**
 * Pré-vérifie les credentials avant signIn pour distinguer :
 * - credentials invalides (toast générique)
 * - email non vérifié (UI dédiée + bouton renvoyer)
 *
 * Renvoie automatiquement un email de vérification si le mot de passe est correct
 * mais que l'email n'est pas encore validé.
 */
export const loginPrecheck = actionClient
  .schema(loginSchema)
  .action(async ({ parsedInput }) => {
    const ip = (await headers()).get("x-forwarded-for") ?? "127.0.0.1";
    const { success } = await authRatelimit.limit(ip);

    if (!success) {
      throw new Error("Trop de tentatives. Veuillez réessayer dans une minute.");
    }

    const user = await prisma.user.findUnique({
      where: { email: parsedInput.email },
    });

    if (!user?.password) {
      return { status: "invalid_credentials" as const };
    }

    const valid = await bcrypt.compare(parsedInput.password, user.password);
    if (!valid) {
      return { status: "invalid_credentials" as const };
    }

    if (!user.emailVerified) {
      const token = await generateVerificationToken(user.email);
      const mail = await sendVerificationEmail(token.identifier, token.token);
      return {
        status: "needs_verification" as const,
        devLink: mail.devLink,
      };
    }

    return { status: "ok" as const };
  });

export const createVendeurProfile = authActionClient
  .schema(createVendeurProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    const existing = await prisma.vendeur.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (existing) {
      throw new Error("Un profil vendeur existe déjà pour ce compte.");
    }

    const vendeur = await prisma.$transaction(async (tx) => {
      try {
        const v = await tx.vendeur.create({
          data: {
            userId: user.id,
            nom: parsedInput.nom,
            prenom: parsedInput.prenom,
            email: parsedInput.email,
            telephone: parsedInput.telephone || null,
            dateNaissance: parsedInput.dateNaissance || null,
            // adresse: parsedInput.adresse || null,
            photo: parsedInput.photo || null,
          },
        });

        const starterPlan = await tx.plan.findFirst({
          where: { nom: "Starter" },
        });

        if (starterPlan) {
          await tx.abonnement.create({
            data: {
              vendeurId: v.id,
              planId: starterPlan.id,
              statut: "ACTIF",
              dateDebut: new Date(),
              essaiFin: null,
              dateFin: null,
              montant: 0,
            },
          });
        }

        await tx.user.update({
          where: { id: user.id },
          data: { role: "VENDEUR" },
        });

        return v;
      } catch (error) {
        console.error("ERREUR TRANSACTION ONBOARDING:", error);
        throw error;
      }
    });

    await logActivity({
      userId: user.id,
      action: "VENDEUR_PROFILE_CREATED",
      subjectType: "Vendeur",
      subjectId: vendeur.id,
    });

    return { vendeur };
  });

export const verifyEmail = actionClient
  .schema(z.object({ token: z.string() }))
  .action(async ({ parsedInput }) => {
    const { token } = parsedInput;

    const existingToken = await prisma.verificationToken.findFirst({
      where: { token },
    });

    if (!existingToken) {
      throw new Error("Jeton de vérification invalide.");
    }

    const hasExpired = new Date(existingToken.expires) < new Date();
    if (hasExpired) {
      throw new Error("Le jeton de vérification a expiré.");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: existingToken.identifier },
    });

    if (!existingUser) {
      throw new Error("Utilisateur non trouvé.");
    }

    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        emailVerified: new Date(),
        email: existingToken.identifier, // Fallback if email changed
      },
    });

    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: existingToken.identifier,
          token: existingToken.token,
        },
      },
    });

    return { success: "Email vérifié avec succès !" };
  });

export const forgotPassword = actionClient
  .schema(forgotPasswordSchema)
  .action(async ({ parsedInput }) => {
    const ip = (await headers()).get("x-forwarded-for") ?? "127.0.0.1";
    const { success } = await authRatelimit.limit(ip);

    if (!success) {
      throw new Error("Trop de tentatives. Veuillez réessayer dans une minute.");
    }

    const { email } = parsedInput;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!existingUser) {
      return { success: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation." };
    }

    const passwordResetToken = await generatePasswordResetToken(email);
    const mail = await sendPasswordResetEmail(
      passwordResetToken.identifier,
      passwordResetToken.token
    );

    return {
      success: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.",
      devLink: mail.devLink,
    };
  });

export const resetPassword = actionClient
  .schema(resetPasswordSchema)
  .action(async ({ parsedInput }) => {
    const { token, password } = parsedInput;

    const existingToken = await prisma.passwordResetToken.findFirst({
      where: { token },
    });

    if (!existingToken) {
      throw new Error("Jeton de réinitialisation invalide.");
    }

    const hasExpired = new Date(existingToken.expires) < new Date();
    if (hasExpired) {
      throw new Error("Le jeton de réinitialisation a expiré. Veuillez en demander un nouveau.");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: existingToken.identifier },
    });

    if (!existingUser) {
      throw new Error("Utilisateur non trouvé.");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: existingUser.id },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({
      where: {
        identifier_token: {
          identifier: existingToken.identifier,
          token: existingToken.token,
        },
      },
    });

    return { success: "Mot de passe réinitialisé avec succès !" };
  });
