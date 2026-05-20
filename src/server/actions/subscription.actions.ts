"use server";

import { z } from "zod";
import { vendeurActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { PaymentService, type PaymentMethod } from "@/server/services/payment.service";

/**
 * Initialise le processus d'abonnement pour un plan choisi par le vendeur.
 * Crée un enregistrement d'abonnement temporaire/pendent et génère le lien de paiement mocké.
 */
export const initiatePlanSubscription = vendeurActionClient
  .schema(
    z.object({
      planId: z.string().min(1),
      method: z.enum(["WAVE", "ORANGE_MONEY", "PAYPAL", "STRIPE"]),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { planId, method } = parsedInput;
    const { vendeurId, user } = ctx;

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error("Plan spécifié introuvable.");
    }

    // Évite la duplication : si un Abonnement ESSAI pour le même plan existe déjà
    // sans paiement confirmé, on le réutilise. Sans ça, chaque clic sur "S'abonner"
    // crée un nouveau row et la table se remplit de doublons orphelins.
    const pendingAbonnement = await prisma.abonnement.findFirst({
      where: {
        vendeurId,
        planId: plan.id,
        statut: "ESSAI",
        paiements: { none: { statut: "CONFIRME" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const abonnement = pendingAbonnement
      ? await prisma.abonnement.update({
          where: { id: pendingAbonnement.id },
          data: {
            dateDebut: new Date(),
            moyenPaiement: method,
            montant: plan.prix,
          },
        })
      : await prisma.abonnement.create({
          data: {
            vendeurId,
            planId: plan.id,
            dateDebut: new Date(),
            statut: "ESSAI",
            montant: plan.prix,
            moyenPaiement: method,
          },
        });

    const paymentResult = await PaymentService.initiateSubscriptionPayment(
      abonnement.id,
      plan.prix,
      method as PaymentMethod,
      vendeurId
    );

    if (!paymentResult.success || !paymentResult.paymentUrl) {
      throw new Error(paymentResult.error || "Échec de l'initialisation du paiement.");
    }

    await logActivity({
      userId: user.id,
      action: `INITIATED_SUBSCRIPTION_PAYMENT`,
      subjectType: "Abonnement",
      subjectId: abonnement.id,
      changes: { plan: plan.nom, price: plan.prix, method },
    });

    return {
      success: true,
      paymentUrl: paymentResult.paymentUrl,
      transactionRef: paymentResult.transactionRef,
    };
  });

/**
 * Simule le succès d'un paiement en appelant directement le webhook/service de traitement de paiement.
 */
export const simulateSuccessfulPayment = vendeurActionClient
  .schema(
    z.object({
      transactionRef: z.string().min(1),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { transactionRef } = parsedInput;
    const { user, vendeurId } = ctx;

    const result = await PaymentService.handlePaymentWebhook(transactionRef, "SUCCESS");

    if (!result.success) {
      throw new Error(result.message || "Échec de la validation de la simulation.");
    }

    // Désactiver/Expirer les autres abonnements actifs pour ne garder que le nouveau
    const payment = await prisma.paiement.findFirst({
      where: { transactionRef },
      include: { abonnement: true },
    });

    if (payment) {
      const activeAbonnementId = payment.abonnementId;
      // Mettre à jour les autres abonnements de ce vendeur pour les résilier/annuler
      await prisma.abonnement.updateMany({
        where: {
          vendeurId,
          id: { not: activeAbonnementId },
          statut: { in: ["ESSAI", "ACTIF"] },
        },
        data: {
          statut: "ANNULE",
          dateFin: new Date(),
        },
      });
    }

    await logActivity({
      userId: user.id,
      action: `SIMULATED_SUCCESSFUL_PAYMENT`,
      subjectType: "Paiement",
      subjectId: payment?.id,
      changes: { transactionRef, status: "SUCCESS" },
    });

    return {
      success: true,
      message: "Simulation de paiement réussie et plan mis à niveau !",
    };
  });

/**
 * Récupère la liste de tous les plans actifs de la base de données.
 */
export const getPlansAction = vendeurActionClient
  .action(async () => {
    return await prisma.plan.findMany({
      where: { actif: true },
      orderBy: { prix: "asc" },
    });
  });

/**
 * Renouvelle l'abonnement courant (ou le dernier en date) avec la méthode choisie.
 * Utile pour PayDunya en one-shot : crée un nouvel Abonnement ESSAI lié au même plan
 * et redirige le vendeur vers l'invoice de paiement.
 */
export const renewCurrentSubscription = vendeurActionClient
  .schema(
    z.object({
      method: z.enum(["WAVE", "ORANGE_MONEY", "STRIPE"]),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { method } = parsedInput;
    const { vendeurId, user } = ctx;

    // Find the most recent subscription to reuse its plan
    const lastAbonnement = await prisma.abonnement.findFirst({
      where: { vendeurId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    if (!lastAbonnement) {
      throw new Error(
        "Aucun abonnement précédent trouvé. Choisissez un plan via la page de tarification."
      );
    }

    const plan = lastAbonnement.plan;

    // Idem qu'initiatePlanSubscription : on réutilise tout Abonnement ESSAI
    // pas encore payé pour ce plan plutôt que d'en empiler un nouveau.
    const pendingAbonnement = await prisma.abonnement.findFirst({
      where: {
        vendeurId,
        planId: plan.id,
        statut: "ESSAI",
        paiements: { none: { statut: "CONFIRME" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const abonnement = pendingAbonnement
      ? await prisma.abonnement.update({
          where: { id: pendingAbonnement.id },
          data: {
            dateDebut: new Date(),
            moyenPaiement: method,
            montant: plan.prix,
          },
        })
      : await prisma.abonnement.create({
          data: {
            vendeurId,
            planId: plan.id,
            dateDebut: new Date(),
            statut: "ESSAI",
            montant: plan.prix,
            moyenPaiement: method,
          },
        });

    const paymentResult = await PaymentService.initiateSubscriptionPayment(
      abonnement.id,
      plan.prix,
      method as PaymentMethod,
      vendeurId
    );

    if (!paymentResult.success || !paymentResult.paymentUrl) {
      throw new Error(
        paymentResult.error || "Échec de l'initialisation du paiement de renouvellement."
      );
    }

    await logActivity({
      userId: user.id,
      action: `INITIATED_SUBSCRIPTION_RENEWAL`,
      subjectType: "Abonnement",
      subjectId: abonnement.id,
      changes: { plan: plan.nom, price: plan.prix, method },
    });

    return {
      success: true,
      paymentUrl: paymentResult.paymentUrl,
      transactionRef: paymentResult.transactionRef,
    };
  });

/**
 * Génère un lien vers le portail de facturation Stripe pour gérer son abonnement.
 */
export const createStripePortalSession = vendeurActionClient
  .action(async ({ ctx }) => {
    const { vendeurId, user } = ctx;

    const vendeur = await prisma.vendeur.findUnique({
      where: { id: vendeurId },
    });

    const stripeCustomerId = vendeur?.stripeCustomerId ?? undefined;

    if (!vendeur || !stripeCustomerId) {
      throw new Error("Vous n'avez pas encore de compte client Stripe actif.");
    }

    const stripe = (await import("@/lib/stripe")).getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Resolve or find the first boutique to redirect back to
    const boutique = await prisma.boutique.findFirst({
      where: { vendeurId }
    });
    const returnUrl = boutique
      ? `${appUrl}/boutiques/${boutique.id}/facturation`
      : `${appUrl}/boutiques`;

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    await logActivity({
      userId: user.id,
      action: `CREATED_STRIPE_PORTAL_SESSION`,
      subjectType: "Vendeur",
      subjectId: vendeurId,
    });

    return {
      success: true,
      url: session.url,
    };
  });
