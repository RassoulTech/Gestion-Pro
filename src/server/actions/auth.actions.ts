"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { actionClient, authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { authRatelimit } from "@/lib/ratelimit";
import { logActivity } from "@/lib/activity-log";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  submitVendorRegistrationSchema,
  completeOAuthRegistrationSchema,
} from "@/schemas/auth.schema";
import { createVendeurProfileSchema } from "@/schemas/vendeur.schema";

import { z } from "zod";
import { generateVerificationToken, generatePasswordResetToken, hashToken } from "@/lib/tokens";
import { sendVerificationEmail, sendPasswordResetEmail, sendAlreadyRegisteredEmail } from "@/lib/mail";
import { DUMMY_PASSWORD_HASH } from "@/lib/password";
import { notifyAdmins } from "@/server/services/notifications";
import {
  verifyEmailToken,
  provisionVendeurWorkspace,
  buildUniqueSlug,
} from "@/server/services/email-verification";

/**
 * Inscription vendeur en 3 étapes — SOUMISSION FINALE.
 *
 * ⚠️ CONTRAINTE CAPITALE : ne crée AUCUN User/Vendeur/Boutique ni notif admin.
 * Les données sont stockées TEMPORAIREMENT dans `pending_registrations` (table
 * de staging) avec un token de vérif haché. Le compte réel n'est créé qu'à la
 * vérification e-mail (création atomique dans verifyEmailToken).
 */
export const submitVendorRegistration = actionClient
  .schema(submitVendorRegistrationSchema)
  .action(async ({ parsedInput }) => {
    const ip = (await headers()).get("x-forwarded-for") ?? "127.0.0.1";
    const { success: rateLimitSuccess } = await authRatelimit.limit(ip);
    if (!rateLimitSuccess) {
      throw new Error("Trop de tentatives. Veuillez réessayer dans une minute.");
    }

    const {
      email,
      password,
      prenom,
      nom,
      telephone,
      boutiqueNom,
      secteurActivite,
      boutiqueAdresse,
      boutiqueTelephone,
      boutiqueEmail,
      logo,
    } = parsedInput;

    await logActivity({ action: "SIGNUP_REQUESTED", changes: { email } });

    // Housekeeping : on purge les inscriptions en attente expirées.
    await prisma.pendingRegistration
      .deleteMany({ where: { expires: { lt: new Date() } } })
      .catch(() => {});

    // Email déjà rattaché à un compte VÉRIFIÉ → réponse générique (anti-énumération).
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true },
    });
    if (existing?.emailVerified) {
      await sendAlreadyRegisteredEmail(email).catch(console.error);
      await logActivity({ action: "SIGNUP_ALREADY_REGISTERED", changes: { email } });
      return { success: "Compte créé ! Email de vérification envoyé." };
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expires = new Date(Date.now() + 24 * 3600 * 1000); // 24 h

    const stagingData = {
      passwordHash,
      prenom,
      nom,
      telephone: telephone || null,
      boutiqueNom,
      secteurActivite,
      boutiqueAdresse: boutiqueAdresse || null,
      boutiqueTelephone: boutiqueTelephone || null,
      boutiqueEmail: boutiqueEmail || null,
      logo: logo || null,
      tokenHash,
      expires,
    };

    // Upsert par email : une re-soumission écrase la précédente (pas de doublon).
    await prisma.pendingRegistration.upsert({
      where: { email },
      create: { email, ...stagingData },
      update: stagingData,
    });

    const mail = await sendVerificationEmail(email, rawToken);
    if (!mail.sent && process.env.NODE_ENV === "production" && !mail.devLink) {
      await logActivity({
        action: "VERIFICATION_EMAIL_FAILED",
        changes: { email, error: mail.error },
      });
      throw new Error("L'envoi de l'e-mail de vérification a échoué. Veuillez réessayer.");
    }

    await logActivity({ action: "VERIFICATION_EMAIL_SENT", changes: { email } });

    return {
      success: mail.sent
        ? "Compte créé ! Email de vérification envoyé."
        : "Compte créé. Email de vérification disponible via le lien de dev ci-dessous.",
      devLink: mail.devLink,
      emailFailed: !mail.sent && !mail.devLink,
    };
  });

/**
 * Complétion d'inscription après connexion Google (e-mail déjà vérifié par le
 * fournisseur). Le User existe déjà ; on crée directement identité + boutique.
 */
export const completeOAuthRegistration = authActionClient
  .schema(completeOAuthRegistrationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        email: true,
        emailVerified: true,
        accounts: { select: { provider: true }, take: 1 },
        vendeur: { select: { id: true } },
      },
    });
    if (!account) throw new Error("Compte introuvable.");
    if (account.vendeur) {
      throw new Error("Un profil vendeur existe déjà pour ce compte.");
    }
    const isOAuth = (account.accounts?.length ?? 0) > 0;
    if (!account.emailVerified && !isOAuth) {
      throw new Error("Veuillez vérifier votre adresse email avant de continuer.");
    }

    const slug = await buildUniqueSlug(parsedInput.boutiqueNom);
    const starterPlan = await prisma.plan.findFirst({ where: { nom: "Starter" } });

    const { boutiqueId } = await prisma.$transaction((tx) =>
      provisionVendeurWorkspace(
        tx,
        user.id,
        {
          nom: parsedInput.nom,
          prenom: parsedInput.prenom,
          email: account.email,
          telephone: parsedInput.telephone || null,
          boutiqueNom: parsedInput.boutiqueNom,
          secteurActivite: parsedInput.secteurActivite,
          boutiqueAdresse: parsedInput.boutiqueAdresse || null,
          boutiqueTelephone: parsedInput.boutiqueTelephone || null,
          boutiqueEmail: parsedInput.boutiqueEmail || null,
          logo: parsedInput.logo || null,
        },
        slug,
        starterPlan?.id ?? null,
      ),
    );

    await logActivity({
      userId: user.id,
      action: "VENDEUR_PROFILE_CREATED",
      subjectType: "Boutique",
      subjectId: boutiqueId,
    });
    await notifyAdmins({
      type: "NOUVEL_UTILISATEUR",
      title: "Nouvelle inscription",
      message: `${user.name ?? account.email} a créé un compte et sa boutique`,
      link: "/admin/utilisateurs",
    }).catch(() => {});

    return { boutiqueId };
  });

export const registerUser = actionClient
  .schema(registerSchema)
  .action(async ({ parsedInput }) => {
    const ip = (await headers()).get("x-forwarded-for") ?? "127.0.0.1";
    const { success: rateLimitSuccess } = await authRatelimit.limit(ip);

    if (!rateLimitSuccess) {
      throw new Error("Trop de tentatives. Veuillez réessayer dans une minute.");
    }

    const { name, email, password } = parsedInput;

    await logActivity({
      action: "SIGNUP_REQUESTED",
      changes: { email, name },
    });

    const existing = await prisma.user.findUnique({ where: { email } });
    const hashedPassword = await bcrypt.hash(password, 12);

    if (existing) {
      if (existing.emailVerified) {
        // Envoi asynchrone (best-effort) de l'email informant que le compte existe déjà
        await sendAlreadyRegisteredEmail(email).catch(console.error);
        await logActivity({
          action: "SIGNUP_ALREADY_REGISTERED",
          changes: { email },
        });
        // Success fictif anti-énumération
        return {
          success: "Compte créé ! Email de vérification envoyé.",
        };
      } else {
        // Le compte existe mais n'est pas vérifié. On met à jour ses infos de connexion
        // et on renvoie le lien de vérification.
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            name,
            password: hashedPassword,
          },
        });

        const verificationToken = await generateVerificationToken(email);
        const mail = await sendVerificationEmail(
          verificationToken.identifier,
          verificationToken.token
        );

        if (!mail.sent && process.env.NODE_ENV === "production" && !mail.devLink) {
          console.error("[register] verification email failed for unverified existing user:", mail.error);
          await logActivity({
            action: "VERIFICATION_EMAIL_FAILED",
            changes: { email, error: mail.error },
          });
          throw new Error("L'envoi de l'e-mail de vérification a échoué. Veuillez réessayer.");
        }

        await logActivity({
          action: "VERIFICATION_EMAIL_SENT",
          changes: { email },
        });

        return {
          success: mail.sent
            ? "Compte créé ! Email de vérification envoyé."
            : "Compte créé. Email de vérification disponible via le lien de dev ci-dessous.",
          devLink: mail.devLink,
          emailFailed: !mail.sent && !mail.devLink,
        };
      }
    }

    // Inscription d'un nouvel utilisateur
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "CLIENT",
      },
    });

    try {
      const verificationToken = await generateVerificationToken(email);
      const mail = await sendVerificationEmail(
        verificationToken.identifier,
        verificationToken.token
      );

      if (!mail.sent && process.env.NODE_ENV === "production" && !mail.devLink) {
        throw new Error(mail.error || "Impossible d'envoyer l'e-mail de vérification.");
      }

      await logActivity({
        action: "VERIFICATION_EMAIL_SENT",
        changes: { email },
      });

      await notifyAdmins({
        type: "NOUVEL_UTILISATEUR",
        title: "Nouvelle inscription",
        message: `${name} (${email}) a créé un compte`,
        link: "/admin/utilisateurs",
      });

      return {
        success: mail.sent
          ? "Compte créé ! Email de vérification envoyé."
          : "Compte créé. Email de vérification disponible via le lien de dev ci-dessous.",
        devLink: mail.devLink,
        emailFailed: !mail.sent && !mail.devLink,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[register] failed to generate/send token, rolling back user creation:", msg);
      await prisma.user.delete({ where: { id: user.id } }).catch(console.error);
      await logActivity({
        action: "VERIFICATION_EMAIL_FAILED",
        changes: { email, error: msg },
      });
      throw new Error("L'envoi de l'e-mail de vérification a échoué. Veuillez réessayer.");
    }
  });

export const resendVerificationEmail = actionClient
  .schema(z.object({ email: z.string().trim().toLowerCase().email("Email invalide") }))
  .action(async ({ parsedInput }) => {
    const { email } = parsedInput;
    const ip = (await headers()).get("x-forwarded-for") ?? "127.0.0.1";
    // Limiter aussi par email cible, pas seulement par IP, pour empêcher le
    // bombardement de la boîte d'une victime.
    const [ipLimit, emailLimit] = await Promise.all([
      authRatelimit.limit(ip),
      authRatelimit.limit(`resend:${email}`),
    ]);

    if (!ipLimit.success || !emailLimit.success) {
      throw new Error("Trop de tentatives. Veuillez réessayer dans une minute.");
    }

    // Inscription vendeur EN ATTENTE → on régénère le token sur la ligne de
    // staging et on renvoie le lien (aucun User n'existe encore).
    const pending = await prisma.pendingRegistration.findUnique({ where: { email } });
    if (pending) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      await prisma.pendingRegistration.update({
        where: { email },
        data: {
          tokenHash: hashToken(rawToken),
          expires: new Date(Date.now() + 24 * 3600 * 1000),
        },
      });
      const mail = await sendVerificationEmail(email, rawToken);
      if (!mail.sent && process.env.NODE_ENV === "production" && !mail.devLink) {
        await logActivity({
          action: "VERIFICATION_EMAIL_FAILED",
          changes: { email, error: mail.error },
        });
        throw new Error("Le serveur d'email est indisponible. Veuillez réessayer plus tard.");
      }
      await logActivity({ action: "VERIFICATION_EMAIL_SENT", changes: { email } });
      return {
        success: "Si un compte non vérifié existe avec cet email, un nouveau lien vient d'être envoyé.",
        devLink: mail.devLink,
        emailFailed: !mail.sent && !mail.devLink,
      };
    }

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

    if (!mail.sent && process.env.NODE_ENV === "production" && !mail.devLink) {
      console.error("[resend] verification email failed:", mail.error);
      await logActivity({
        action: "VERIFICATION_EMAIL_FAILED",
        changes: { email, error: mail.error },
      });
      throw new Error("Le serveur d'email est indisponible. Veuillez réessayer plus tard.");
    }

    await logActivity({
      action: "VERIFICATION_EMAIL_SENT",
      changes: { email },
    });

    return {
      success: "Si un compte non vérifié existe avec cet email, un nouveau lien vient d'être envoyé.",
      devLink: mail.devLink,
      emailFailed: !mail.sent && !mail.devLink,
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
    const [ipLimit, emailLimit] = await Promise.all([
      authRatelimit.limit(ip),
      authRatelimit.limit(`login:${parsedInput.email}`),
    ]);

    if (!ipLimit.success || !emailLimit.success) {
      throw new Error("Trop de tentatives. Veuillez réessayer dans une minute.");
    }

    const user = await prisma.user.findUnique({
      where: { email: parsedInput.email },
    });

    if (!user?.password) {
      // Comparaison à vide pour égaliser le temps de réponse (anti-énumération).
      await bcrypt.compare(parsedInput.password, DUMMY_PASSWORD_HASH);
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
        emailFailed: !mail.sent && !mail.devLink,
      };
    }

    return { status: "ok" as const };
  });

export const createVendeurProfile = authActionClient
  .schema(createVendeurProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    // ⚠️ SECURITY (défense en profondeur) : interdire la création d'un profil
    // vendeur tant que l'email n'est pas vérifié. Les comptes manuels non vérifiés
    // n'ont pas de session ; ce garde couvre toute régression de garde amont.
    // Les comptes OAuth (Google) sont autorisés (preuve d'email apportée par Google).
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        emailVerified: true,
        accounts: { select: { provider: true }, take: 1 },
      },
    });
    const isOAuth = (account?.accounts?.length ?? 0) > 0;
    if (!account?.emailVerified && !isOAuth) {
      throw new Error(
        "Veuillez vérifier votre adresse email avant de créer un profil vendeur."
      );
    }

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
            adresse: parsedInput.adresse || null,
            photo: parsedInput.photo || null,
          },
        });

        const starterPlan = await tx.plan.findFirst({
          where: { nom: "Starter" },
        });

        if (starterPlan) {
          // Starter = ESSAI de 15 jours (décompte depuis la création, persisté).
          const { TRIAL_DAYS } = await import("@/lib/plan-capabilities");
          const nowTrial = new Date();
          await tx.abonnement.create({
            data: {
              vendeurId: v.id,
              planId: starterPlan.id,
              statut: "ESSAI",
              dateDebut: nowTrial,
              essaiFin: new Date(nowTrial.getTime() + TRIAL_DAYS * 24 * 3600 * 1000),
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
  .schema(z.object({ token: z.string().min(1, "Jeton requis") }))
  .action(async ({ parsedInput }) => {
    // Logique mutualisée avec la route GET /api/verify-email.
    const result = await verifyEmailToken(parsedInput.token);

    if (result.status === "invalid") {
      throw new Error("Jeton de vérification invalide.");
    }
    if (result.status === "expired") {
      throw new Error("Le jeton de vérification a expiré.");
    }

    return { success: "Email vérifié avec succès !" };
  });

export const forgotPassword = actionClient
  .schema(forgotPasswordSchema)
  .action(async ({ parsedInput }) => {
    const { email } = parsedInput;
    const ip = (await headers()).get("x-forwarded-for") ?? "127.0.0.1";
    // Limiter aussi par email cible pour empêcher le bombardement d'une victime.
    const [ipLimit, emailLimit] = await Promise.all([
      authRatelimit.limit(ip),
      authRatelimit.limit(`pwreset:${email}`),
    ]);

    if (!ipLimit.success || !emailLimit.success) {
      throw new Error("Trop de tentatives. Veuillez réessayer dans une minute.");
    }

    await logActivity({
      action: "PASSWORD_RESET_REQUESTED",
      changes: { email },
    });

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

    if (!mail.sent && process.env.NODE_ENV === "production" && !mail.devLink) {
      console.error("[forgot-password] reset email failed:", mail.error);
      await logActivity({
        action: "PASSWORD_RESET_EMAIL_FAILED",
        changes: { email, error: mail.error },
      });
      return {
        success: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.",
        emailFailed: true,
      };
    }

    await logActivity({
      action: "PASSWORD_RESET_EMAIL_SENT",
      changes: { email },
    });

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
      where: { token: hashToken(token) },
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

    await logActivity({
      userId: existingUser.id,
      action: "PASSWORD_RESET_COMPLETED",
      changes: { email: existingUser.email },
    });

    return { success: "Mot de passe réinitialisé avec succès !" };
  });
