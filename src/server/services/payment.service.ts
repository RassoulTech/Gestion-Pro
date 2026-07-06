import { prisma } from "@/lib/prisma";
import {
  sendSubscriptionActivatedEmailToClient,
  sendSubscriptionAlertToAdmin,
} from "@/lib/mail";
import { getPaytechConfig, createPaytechCheckout } from "@/lib/paytech";

export type PaymentMethod = "WAVE" | "ORANGE_MONEY" | "CASH_ON_DELIVERY";

export interface PaymentInitiationResult {
  success: boolean;
  paymentUrl?: string; // URL de redirection vers la page de paiement PayTech
  transactionRef?: string;
  error?: string;
}

/**
 * Service de paiement centralisé de GestionPro.
 * Unique passerelle : PayTech (Wave / Orange Money via Mobile Money), en sandbox
 * comme en live. Toute la logique d'appel passe par `@/lib/paytech`.
 */
export class PaymentService {
  /**
   * Initialise un paiement PayTech pour l'abonnement SaaS d'un vendeur.
   *
   * @param abonnementId L'ID de l'abonnement en cours d'activation
   * @param amount Le montant en FCFA (XOF)
   * @param method La méthode Mobile Money sélectionnée
   * @param vendeurId L'ID du vendeur
   * @returns Un lien de redirection vers la page de paiement PayTech
   */
  static async initiateSubscriptionPayment(
    abonnementId: string,
    amount: number,
    method: PaymentMethod,
    vendeurId: string
  ): Promise<PaymentInitiationResult> {
    try {
      const abonnement = await prisma.abonnement.findUnique({
        where: { id: abonnementId },
        include: { plan: true },
      });

      if (!abonnement) {
        return { success: false, error: "Abonnement introuvable." };
      }

      // Un vendeur doit posséder au moins une boutique avant de s'abonner — les
      // URLs success/cancel renvoient vers /boutiques/[id]/facturation.
      const firstBoutique = await prisma.boutique.findFirst({
        where: { vendeurId },
        select: { id: true },
      });
      if (!firstBoutique) {
        return {
          success: false,
          error: "Vous devez créer une boutique avant de souscrire à un plan.",
        };
      }

      const config = getPaytechConfig();
      if (!config.enabled || !config.apiKey || !config.apiSecret) {
        return {
          success: false,
          error:
            "Le paiement Mobile Money (PayTech) n'est pas activé ou configuré sur ce serveur.",
        };
      }

      const facturationUrl = `${config.appUrl}/boutiques/${firstBoutique.id}/facturation`;
      const transactionRef = `SUB-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)
        .toUpperCase()}`;

      // Audit : on trace dès la création le fournisseur, le mode et la devise.
      const auditBase = {
        provider: "paytech",
        mode: config.sandbox ? "sandbox" : "live",
        currency: config.currency,
      } as const;

      // Enregistrement du paiement EN_ATTENTE (aucune activation avant confirmation).
      const paiement = await prisma.paiement.create({
        data: {
          abonnementId: abonnement.id,
          montant: amount,
          methode: method,
          statut: "EN_ATTENTE",
          transactionRef,
          metadata: { ...auditBase },
        },
      });

      const checkout = await createPaytechCheckout({
        itemName: `Abonnement GestionPro - Plan ${abonnement.plan.nom}`,
        amount,
        refCommand: transactionRef,
        commandName: "Abonnement sur GestionPro",
        successUrl: `${facturationUrl}?success=true`,
        cancelUrl: `${facturationUrl}?success=false`,
        customField: {
          kind: "subscription",
          abonnementId: abonnement.id,
          vendeurId,
          transactionRef,
        },
      });

      if (!checkout.success || !checkout.redirectUrl) {
        return {
          success: false,
          error:
            checkout.error ||
            "Impossible d'initier le paiement Mobile Money via PayTech.",
        };
      }

      // Trace du token PayTech (payload d'audit) sur le paiement créé.
      await prisma.paiement.update({
        where: { id: paiement.id },
        data: { metadata: { ...auditBase, token: checkout.token } },
      });

      return {
        success: true,
        paymentUrl: checkout.redirectUrl,
        transactionRef,
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur interne.";
      console.error("Erreur d'initialisation de paiement :", e);
      return { success: false, error: message };
    }
  }

  /**
   * Traite la confirmation d'un paiement d'abonnement reçue via l'IPN PayTech.
   *
   * @param transactionRef La référence de transaction unique (ref_command)
   * @param status Le statut retourné par la passerelle
   * @returns Le statut mis à jour en base de données
   */
  static async handlePaymentWebhook(
    transactionRef: string,
    status: "SUCCESS" | "FAILED"
  ) {
    const paiement = await prisma.paiement.findFirst({
      where: { transactionRef },
      include: {
        abonnement: {
          include: {
            plan: true,
            vendeur: {
              include: { boutiques: true },
            },
          },
        },
      },
    });

    if (!paiement) {
      throw new Error(`Paiement introuvable pour la référence ${transactionRef}`);
    }

    // Idempotence : l'IPN peut être rejoué par la passerelle. On ne re-mute jamais
    // un paiement déjà dans un état terminal, et un événement FAILED ne dégrade
    // jamais un paiement déjà confirmé.
    if (paiement.statut === "CONFIRME") {
      return { success: true, message: "Paiement déjà confirmé (idempotent)." };
    }
    if (status === "FAILED" && paiement.statut === "ECHOUE") {
      return { success: false, message: "Paiement déjà marqué en échec." };
    }

    if (status === "SUCCESS") {
      const now = new Date();
      // Prolonge depuis la dateFin courante si l'abonnement tourne encore, pour
      // qu'un renouvellement anticipé cumule au lieu de rogner le temps restant.
      const SUBSCRIPTION_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
      const currentEnd = paiement.abonnement.dateFin;
      const base =
        currentEnd && currentEnd.getTime() > now.getTime() ? currentEnd : now;
      const newDateFin = new Date(base.getTime() + SUBSCRIPTION_PERIOD_MS);

      await prisma.paiement.update({
        where: { id: paiement.id },
        data: { statut: "CONFIRME" },
      });

      await prisma.abonnement.update({
        where: { id: paiement.abonnementId },
        data: {
          statut: "ACTIF",
          dateDebut: paiement.abonnement.dateDebut ?? now,
          dateFin: newDateFin,
        },
      });

      // --- ENVOI DES EMAILS ---
      const vendeur = paiement.abonnement.vendeur;
      const plan = paiement.abonnement.plan;
      const firstBoutique = vendeur?.boutiques[0];

      if (
        vendeur &&
        plan &&
        (plan.nom.toLowerCase().includes("pro") ||
          plan.nom.toLowerCase().includes("enterprise"))
      ) {
        await sendSubscriptionActivatedEmailToClient(
          vendeur.email,
          vendeur.prenom || vendeur.nom || "Cher client",
          plan.nom,
          newDateFin
        );
        await sendSubscriptionAlertToAdmin(
          firstBoutique?.nom || "Aucune boutique",
          plan.nom,
          paiement.montant,
          `${vendeur.prenom || ""} ${vendeur.nom || ""}`.trim() || "Inconnu",
          vendeur.email
        );
      }

      // --- FACTURE D'ABONNEMENT (auto) ---
      // PDF généré + envoyé par e-mail au vendeur, référencé dans paiement.metadata
      // (retéléchargeable depuis Facturation). Best-effort : un échec de facture
      // n'annule JAMAIS l'activation de l'abonnement (déjà commitée ci-dessus).
      try {
        const { generateAndSendSubscriptionInvoice } = await import(
          "@/server/services/subscription-invoice"
        );
        await generateAndSendSubscriptionInvoice(paiement.id);
      } catch (err) {
        console.error("[payment.service] facture d'abonnement échouée:", err);
      }

      return { success: true, message: "Abonnement activé avec succès." };
    }

    await prisma.paiement.update({
      where: { id: paiement.id },
      data: { statut: "ECHOUE" },
    });

    if (paiement.abonnementId) {
      await prisma.abonnement.update({
        where: { id: paiement.abonnementId },
        data: { statut: "ANNULE" },
      });
    }

    return { success: false, message: "Le paiement a échoué." };
  }
}
