import { prisma } from "@/lib/prisma";

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
 * locales (Wave, Orange Money via CinetPay, FedaPay, ou PayTech) et internationales (PayPal, Stripe).
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
        const stripe = (await import("@/lib/stripe")).stripe;

        // Resolve/Create Stripe Customer
        let stripeCustomerId = (await prisma.vendeur.findUnique({ where: { id: vendeurId } }))?.stripeCustomerId;
        
        if (!stripeCustomerId) {
          // Fetch vendeur email
          const user = await prisma.user.findFirst({
            where: {
              vendeur: { id: vendeurId }
            }
          });

          if (user) {
            const customer = await stripe.customers.create({
              email: user.email || undefined,
              name: user.name || undefined,
              metadata: { vendeurId }
            });
            stripeCustomerId = customer.id;
            await prisma.vendeur.update({
              where: { id: vendeurId },
              data: { stripeCustomerId }
            });
          }
        }

        // Find price id based on plan or default monthly
        let priceId = abonnement.plan.stripePriceIdMonthly;
        if (!priceId) {
          if (abonnement.plan.codePlan === "PRO") {
            priceId = process.env.STRIPE_PRICE_PRO_MONTHLY || "price_pro_monthly_mock";
          } else if (abonnement.plan.codePlan === "ENTERPRISE") {
            priceId = process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || "price_enterprise_monthly_mock";
          } else {
            priceId = "price_starter_free";
          }
        }

        // Get app URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
          customer: stripeCustomerId || undefined,
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url: `${appUrl}/facturation?session_id={CHECKOUT_SESSION_ID}&success=true`,
          cancel_url: `${appUrl}/facturation?success=false`,
          subscription_data: {
            metadata: {
              vendeurId,
              abonnementId: abonnement.id,
              planId: abonnement.plan.id
            }
          },
          metadata: {
            vendeurId,
            abonnementId: abonnement.id,
            planId: abonnement.plan.id
          }
        });

        // Update payment with checkout transaction ref (session id)
        await prisma.paiement.update({
          where: { id: paiement.id },
          data: {
            transactionRef: session.id
          }
        });

        return {
          success: true,
          paymentUrl: session.url || undefined,
          transactionRef: session.id
        };
      }

      // 1. SI WAVE / ORANGE MONEY (Intégration réelle CinetPay si activé, sinon Mock de test) :
      if (method === "WAVE" || method === "ORANGE_MONEY") {
        if (process.env.CINETPAY_ENABLED === "true" || env.CINETPAY_ENABLED === "true") {
          const { CinetPayClient } = await import("@/lib/cinetpay");
          
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          const cpResponse = await CinetPayClient.initiatePayment({
            transactionId: paiement.transactionRef || `SUB-${Date.now()}`,
            amount: amount,
            currency: "XOF",
            description: `Abonnement GestionPro - Plan ${abonnement.plan.nom}`,
            notifyUrl: `${appUrl}/api/webhooks/cinetpay`,
            returnUrl: `${appUrl}/facturation?success=true`,
            channels: "MOBILE_MONEY",
          });

          if (cpResponse.code === "201" && cpResponse.data) {
            // Enregistrer le token cinetpay
            await prisma.abonnement.update({
              where: { id: abonnementId },
              data: {
                cinetpayPaymentToken: cpResponse.data.payment_token
              }
            });

            await prisma.paiement.update({
              where: { id: paiement.id },
              data: {
                cinetpayPaymentToken: cpResponse.data.payment_token
              }
            });

            return {
              success: true,
              paymentUrl: cpResponse.data.payment_url,
              transactionRef: paiement.transactionRef || undefined,
            };
          } else {
            console.error("CinetPay API error :", cpResponse);
            return {
              success: false,
              error: cpResponse.message || "Impossible d'initier le paiement Mobile Money.",
            };
          }
        }

        // Sinon, simulation pour test bac à sable local :
        return {
          success: true,
          paymentUrl: `/checkout/mock?ref=${paiement.transactionRef}&amount=${amount}&method=${method}`,
          transactionRef: paiement.transactionRef || undefined,
        };
      }

      // 2. SI PAYPAL :
      if (method === "PAYPAL") {
        /**
         * Exemple d'intégration PayPal (v2/checkout/orders) :
         * 
         * const response = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
         *   method: "POST",
         *   headers: {
         *     "Content-Type": "application/json",
         *     Authorization: `Bearer ${await getPayPalAccessToken()}`,
         *   },
         *   body: JSON.stringify({
         *     intent: "CAPTURE",
         *     purchase_units: [{
         *       reference_id: paiement.transactionRef,
         *       amount: { currency_code: "USD", value: (amount / 600).toFixed(2) }, // Conversion FCFA -> USD si nécessaire
         *     }],
         *     application_context: {
         *       return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payment/paypal-return`,
         *       cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/boutiques`,
         *     }
         *   })
         * });
         * const order = await response.json();
         * const approveUrl = order.links.find((l: any) => l.rel === "approve")?.href;
         * return { success: true, paymentUrl: approveUrl, transactionRef: order.id };
         */
        return {
          success: true,
          paymentUrl: `/checkout/mock?ref=${paiement.transactionRef}&amount=${amount}&method=PAYPAL`,
          transactionRef: paiement.transactionRef || undefined,
        };
      }

      return { success: false, error: "Méthode de paiement non supportée." };
    } catch (e: any) {
      console.error("Erreur d'initialisation de paiement :", e);
      return { success: false, error: e.message || "Erreur interne." };
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
      include: { abonnement: true },
    });

    if (!paiement) {
      throw new Error(`Paiement introuvable pour la référence ${transactionRef}`);
    }

    if (status === "SUCCESS") {
      // 1. Confirmer le paiement
      await prisma.paiement.update({
        where: { id: paiement.id },
        data: { statut: "CONFIRME" },
      });

      // 2. Activer l'abonnement associé
      await prisma.abonnement.update({
        where: { id: paiement.abonnementId },
        data: {
          statut: "ACTIF",
          dateDebut: new Date(),
          dateFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Ex: +30 jours
        },
      });

      return { success: true, message: "Abonnement activé avec succès." };
    } else {
      // Mettre le paiement en échec
      await prisma.paiement.update({
        where: { id: paiement.id },
        data: { statut: "ECHOUE" },
      });

      return { success: false, message: "Le paiement a échoué." };
    }
  }
}
