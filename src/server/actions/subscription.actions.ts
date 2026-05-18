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
      method: z.enum(["WAVE", "ORANGE_MONEY", "PAYPAL"]),
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

    // On crée un abonnement temporaire en attente de paiement (statut ESSAI ou ACTIF lors du webhook)
    const abonnement = await prisma.abonnement.create({
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
      method as PaymentMethod
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
