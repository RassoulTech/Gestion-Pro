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
      method: z.enum(["WAVE", "ORANGE_MONEY"]),
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
        statut: "EN_ATTENTE",
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
            statut: "EN_ATTENTE",
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
 * Réutilise un Abonnement EN_ATTENTE non payé pour le même plan puis redirige le
 * vendeur vers la page de paiement PayTech.
 */
export const renewCurrentSubscription = vendeurActionClient
  .schema(
    z.object({
      method: z.enum(["WAVE", "ORANGE_MONEY"]),
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
        statut: "EN_ATTENTE",
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
            statut: "EN_ATTENTE",
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
