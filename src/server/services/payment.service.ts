import { prisma } from "@/lib/prisma";
import { 
  sendSubscriptionActivatedEmailToClient, 
  sendSubscriptionAlertToAdmin 
} from "@/lib/mail";

export type PaymentMethod = "WAVE" | "ORANGE_MONEY" | "PAYPAL" | "CASH_ON_DELIVERY" | "STRIPE";

export interface PaymentInitiationResult {
  success: boolean;
  paymentUrl?: string; // Redirect URL for Wave, Orange Money, PayPal, or Stripe checkout
  transactionRef?: string;
  error?: string;
}

/**
 * Service centralisé pour la gestion des paiements dans GestionPro.
 * Ce module fournit la structure nécessaire pour intégrer les passerelles de paiement
 * locales (Wave, Orange Money via PayDunya) et internationales (PayPal, Stripe).
 */
export class PaymentService {
  /**
   * Initialise un paiement pour l'abonnement SaaS d'un vendeur (Orange Money, Wave, PayPal, Stripe).
   * 
   * @param abonnementId L'ID de l'abonnement en cours d'activation
   * @param amount Le montant en FCFA ou USD
   * @param method La méthode sélectionnée
   * @param vendeurId L'ID du vendeur
   * @returns Un lien de redirection vers la passerelle sécurisée
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

      // A vendor must own at least one boutique before subscribing —
      // success/cancel URLs redirect back to /boutiques/[id]/facturation.
      // Without a boutique we'd hit /boutiques (no id) which doesn't exist.
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
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const facturationPath = `/boutiques/${firstBoutique.id}/facturation`;

      // Création de l'enregistrement de paiement en attente dans la base de données
      const paiement = await prisma.paiement.create({
        data: {
          abonnementId: abonnement.id,
          montant: amount,
          methode: method,
          statut: "EN_ATTENTE",
          transactionRef: `SUB-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        },
      });

      // ─── INTEGRATION STRIPE CHECKOUT ──────────────────────────────
      if (method === "STRIPE") {
        const stripeEnabled = process.env.STRIPE_ENABLED === "true";
        const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
        const stripeConfigured =
          stripeEnabled &&
          stripeSecret.length > 0 &&
          !stripeSecret.includes("mock");

        if (!stripeConfigured) {
          return {
            success: false,
            error: "Le paiement par carte bancaire (Stripe) n'est pas configuré sur ce serveur.",
          };
        }

        const stripe = (await import("@/lib/stripe")).getStripe();

        // Resolve/Create Stripe Customer
        const vendeurRow = await prisma.vendeur.findUnique({
          where: { id: vendeurId },
        });
        let stripeCustomerId: string | undefined = vendeurRow?.stripeCustomerId ?? undefined;

        if (!stripeCustomerId) {
          const user = await prisma.user.findFirst({
            where: { vendeur: { id: vendeurId } },
          });

          if (user) {
            const customer = await stripe.customers.create({
              email: user.email || undefined,
              name: user.name || undefined,
              metadata: { vendeurId },
            });
            stripeCustomerId = customer.id;
            await prisma.vendeur.update({
              where: { id: vendeurId },
              data: { stripeCustomerId },
            });
          }
        }

        // Find price id based on plan or default monthly
        const plan = abonnement.plan;
        let priceId: string | undefined = plan.stripePriceIdMonthly ?? undefined;
        if (!priceId) {
          if (plan.codePlan === "PRO") {
            priceId = process.env.STRIPE_PRICE_PRO_MONTHLY || "";
          } else if (plan.codePlan === "ENTERPRISE") {
            priceId = process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || "";
          }
        }

        // Refuser tout price ID factice ou manquant — Stripe rejetterait sinon.
        if (!priceId || priceId.includes("mock")) {
          return {
            success: false,
            error:
              "Configuration Stripe incomplète : aucun price ID valide n'est défini pour ce plan. Contactez l'administrateur.",
          };
        }

        const session = await stripe.checkout.sessions.create({
          customer: stripeCustomerId || undefined,
          line_items: [{ price: priceId, quantity: 1 }],
          mode: "subscription",
          success_url: `${appUrl}${facturationPath}?session_id={CHECKOUT_SESSION_ID}&success=true`,
          cancel_url: `${appUrl}${facturationPath}?success=false`,
          subscription_data: {
            metadata: {
              vendeurId,
              abonnementId: abonnement.id,
              planId: abonnement.plan.id,
            },
          },
          metadata: {
            vendeurId,
            abonnementId: abonnement.id,
            planId: abonnement.plan.id,
          },
        });

        await prisma.paiement.update({
          where: { id: paiement.id },
          data: { transactionRef: session.id },
        });

        return {
          success: true,
          paymentUrl: session.url || undefined,
          transactionRef: session.id,
        };
      }

      // 1. SI WAVE / ORANGE MONEY (Intégration réelle PayTech si activé, sinon Mock de test) :
      if (method === "WAVE" || method === "ORANGE_MONEY") {
        const paytechConfigured =
          process.env.PAYTECH_ENABLED === "true" &&
          process.env.PAYTECH_API_KEY &&
          process.env.PAYTECH_API_SECRET;

        if (paytechConfigured) {
          try {
            const paytechUrl = "https://paytech.sn/api/payment/request-payment";
            const requestBody = {
              item_name: `Abonnement GestionPro - Plan ${abonnement.plan.nom}`,
              item_price: amount,
              ref_command: paiement.transactionRef || `SUB-${Date.now()}`,
              command_name: `Abonnement sur GestionPro`,
              currency: "XOF",
              env: process.env.PAYTECH_ENV || "test",
              ipn_url: `${appUrl}/api/paytech/ipn`,
              success_url: `${appUrl}${facturationPath}?success=true`,
              cancel_url: `${appUrl}${facturationPath}?success=false`,
              custom_field: JSON.stringify({
                kind: "subscription",
                abonnementId: abonnement.id,
                vendeurId,
                transactionRef: paiement.transactionRef || undefined,
              })
            };

            const response = await fetch(paytechUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "API_KEY": process.env.PAYTECH_API_KEY || "",
                "API_SECRET": process.env.PAYTECH_API_SECRET || ""
              },
              body: JSON.stringify(requestBody)
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success === 1 || data.success === true) {
                const redirectUrl = data.redirectUrl || data.redirect_url;
                if (redirectUrl && data.token) {
                  await prisma.abonnement.update({
                    where: { id: abonnementId },
                    data: { paydunyaToken: data.token },
                  });

                  await prisma.paiement.update({
                    where: { id: paiement.id },
                    data: { paydunyaToken: data.token },
                  });

                  return {
                    success: true,
                    paymentUrl: redirectUrl,
                    transactionRef: paiement.transactionRef || undefined,
                  };
                }
              }
            }

            const errorText = await response.text();
            console.error("PayTech subscription API error :", errorText);
            return {
              success: false,
              error: "Impossible d'initier le paiement Mobile Money via PayTech.",
            };
          } catch (error: any) {
            console.error("PayTech subscription integration error :", error);
            return {
              success: false,
              error: error.message || "Erreur lors de l'appel à PayTech.",
            };
          }
        }

        return {
          success: false,
          error: "Le paiement par Mobile Money (PayTech) n'est pas activé ou configuré sur ce serveur.",
        };
      }

      if (method === "PAYPAL") {
        return {
          success: false,
          error: "PayPal n'est pas encore intégré dans cette version.",
        };
      }

      return { success: false, error: "Méthode de paiement non supportée." };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur interne.";
      console.error("Erreur d'initialisation de paiement :", e);
      return { success: false, error: message };
    }
  }

  /**
   * Traite le retour du Webhook après confirmation de la transaction par la passerelle.
   * 
   * @param transactionRef La référence de transaction unique
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
              include: { boutiques: true }
            }
          }
        } 
      },
    });

    if (!paiement) {
      throw new Error(`Paiement introuvable pour la référence ${transactionRef}`);
    }

    // Idempotence: webhooks may be replayed by the gateway. Never re-mutate
    // a payment that is already in a terminal state, and never let a FAILED
    // event downgrade a previously confirmed payment.
    if (paiement.statut === "CONFIRME") {
      return { success: true, message: "Paiement déjà confirmé (idempotent)." };
    }
    if (status === "FAILED" && paiement.statut === "ECHOUE") {
      return { success: false, message: "Paiement déjà marqué en échec." };
    }

    if (status === "SUCCESS") {
      const now = new Date();
      // Extend from the current dateFin if the subscription is still running,
      // so an early renewal cumulates instead of shrinking the remaining time.
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

      // --- SEND EMAILS ---
      const vendeur = paiement.abonnement.vendeur;
      const plan = paiement.abonnement.plan;
      const firstBoutique = vendeur?.boutiques[0];

      if (vendeur && plan && (plan.nom.toLowerCase().includes("pro") || plan.nom.toLowerCase().includes("enterprise"))) {
        // Envoi au client
        await sendSubscriptionActivatedEmailToClient(
          vendeur.email,
          vendeur.prenom || vendeur.nom || "Cher client",
          plan.nom,
          newDateFin
        );
        // Envoi à l'Admin
        await sendSubscriptionAlertToAdmin(
          firstBoutique?.nom || "Aucune boutique",
          plan.nom,
          paiement.montant,
          `${vendeur.prenom || ""} ${vendeur.nom || ""}`.trim() || "Inconnu",
          vendeur.email
        );
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
