import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { clearQuotaCache } from "@/lib/quotas";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature");

  if (!signature) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as any;

  try {
    if (event.type === "checkout.session.completed") {
      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      // Metadata fields that we sent during creation
      const vendeurId = session.metadata?.vendeurId || session.subscription_data?.metadata?.vendeurId;
      const abonnementId = session.metadata?.abonnementId || session.subscription_data?.metadata?.abonnementId;
      const planId = session.metadata?.planId || session.subscription_data?.metadata?.planId;

      if (!vendeurId || !abonnementId || !planId) {
        console.error("Missing metadata inside checkout.session.completed", session.metadata);
        return new NextResponse("Missing metadata", { status: 400 });
      }

      // Update Vendeur customer ID if not set
      await prisma.vendeur.update({
        where: { id: vendeurId },
        data: { stripeCustomerId: customerId },
      });

      // Update Abonnement
      await prisma.abonnement.update({
        where: { id: abonnementId },
        data: {
          statut: "ACTIF",
          stripeSubscriptionId: subscriptionId,
          dateDebut: new Date(),
          dateFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          moyenPaiement: "Stripe",
        },
      });

      // Find or create payment
      const payment = await prisma.paiement.findFirst({
        where: { transactionRef: session.id },
      });

      if (payment) {
        await prisma.paiement.update({
          where: { id: payment.id },
          data: {
            statut: "CONFIRME",
            metadata: JSON.parse(JSON.stringify(session)),
          },
        });
      } else {
        await prisma.paiement.create({
          data: {
            abonnementId,
            montant: session.amount_total ? session.amount_total / 100 : 0,
            methode: "STRIPE",
            statut: "CONFIRME",
            transactionRef: session.id,
            metadata: JSON.parse(JSON.stringify(session)),
          },
        });
      }

      // Deactivate/Cancel other active/trial abonnements of this vendeur to prevent overlap
      await prisma.abonnement.updateMany({
        where: {
          vendeurId,
          id: { not: abonnementId },
          statut: { in: ["ESSAI", "ACTIF"] },
        },
        data: {
          statut: "ANNULE",
          dateFin: new Date(),
        },
      });

      // Clear quota cache
      clearQuotaCache(vendeurId);
      console.log(`Stripe subscription activated successfully for vendeur: ${vendeurId}`);
    }

    if (event.type === "invoice.payment_succeeded") {
      const subscriptionId = session.subscription as string;
      if (subscriptionId) {
        // Find abonnement
        const abonnement = await prisma.abonnement.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        });

        if (abonnement) {
          // Extend abonnement dateFin by 30 days
          await prisma.abonnement.update({
            where: { id: abonnement.id },
            data: {
              statut: "ACTIF",
              dateFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });

          // Create payment confirmation record
          await prisma.paiement.create({
            data: {
              abonnementId: abonnement.id,
              montant: session.amount_paid ? session.amount_paid / 100 : 0,
              methode: "STRIPE",
              statut: "CONFIRME",
              transactionRef: session.id || `INV-${Date.now()}`,
              metadata: JSON.parse(JSON.stringify(session)),
            },
          });

          // Clear quota cache
          clearQuotaCache(abonnement.vendeurId);
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscriptionId = session.id as string;
      if (subscriptionId) {
        // Find and cancel abonnement
        const abonnement = await prisma.abonnement.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        });

        if (abonnement) {
          await prisma.abonnement.update({
            where: { id: abonnement.id },
            data: {
              statut: "ANNULE",
              dateFin: new Date(),
            },
          });

          // Clear quota cache
          clearQuotaCache(abonnement.vendeurId);
        }
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscriptionId = session.id as string;
      const cancelAtPeriodEnd = session.cancel_at_period_end as boolean;
      if (subscriptionId) {
        const abonnement = await prisma.abonnement.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        });

        if (abonnement) {
          await prisma.abonnement.update({
            where: { id: abonnement.id },
            data: {
              cancelAtPeriodEnd,
            },
          });

          // Clear quota cache
          clearQuotaCache(abonnement.vendeurId);
        }
      }
    }

    return new NextResponse("Webhook processed successfully", { status: 200 });
  } catch (err: any) {
    console.error("Webhook event handling failed:", err);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 500 });
  }
}
