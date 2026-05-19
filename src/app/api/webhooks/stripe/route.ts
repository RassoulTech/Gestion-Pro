import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { clearQuotaCache } from "@/lib/quotas";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function expandableId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature");

  if (!signature) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    const message = errorMessage(err);
    console.error(`Webhook signature verification failed:`, message);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const type = session.metadata?.type;

      if (type === "marketplace_order") {
        const commandeIdsStr = session.metadata?.commandeIds;
        if (commandeIdsStr) {
          const commandeIds = commandeIdsStr.split(",");
          await prisma.commandeClient.updateMany({
            where: { id: { in: commandeIds } },
            data: {
              statutPaiement: "CONFIRME",
              etat: "VALIDEE",
              metadata: JSON.parse(JSON.stringify(session)),
            },
          });
          console.log(`Stripe marketplace orders ${commandeIdsStr} confirmed successfully!`);
        }
        return new NextResponse("Marketplace orders confirmed", { status: 200 });
      }

      const subscriptionId = expandableId(session.subscription);
      const customerId = expandableId(session.customer);

      const vendeurId = session.metadata?.vendeurId;
      const abonnementId = session.metadata?.abonnementId;
      const planId = session.metadata?.planId;

      if (!vendeurId || !abonnementId || !planId) {
        console.error("Missing metadata inside checkout.session.completed", session.metadata);
        return new NextResponse("Missing metadata", { status: 400 });
      }

      if (customerId) {
        await prisma.vendeur.update({
          where: { id: vendeurId },
          data: { stripeCustomerId: customerId },
        });
      }

      await prisma.abonnement.update({
        where: { id: abonnementId },
        data: {
          statut: "ACTIF",
          stripeSubscriptionId: subscriptionId,
          dateDebut: new Date(),
          dateFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          moyenPaiement: "Stripe",
        },
      });

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

      clearQuotaCache(vendeurId);
      console.log(`Stripe subscription activated successfully for vendeur: ${vendeurId}`);
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null;
      };
      const subscriptionId = expandableId(invoice.subscription);
      if (subscriptionId) {
        const abonnement = await prisma.abonnement.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        });

        if (abonnement) {
          await prisma.abonnement.update({
            where: { id: abonnement.id },
            data: {
              statut: "ACTIF",
              dateFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });

          await prisma.paiement.create({
            data: {
              abonnementId: abonnement.id,
              montant: invoice.amount_paid ? invoice.amount_paid / 100 : 0,
              methode: "STRIPE",
              statut: "CONFIRME",
              transactionRef: invoice.id || `INV-${Date.now()}`,
              metadata: JSON.parse(JSON.stringify(invoice)),
            },
          });

          clearQuotaCache(abonnement.vendeurId);
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const abonnement = await prisma.abonnement.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (abonnement) {
        await prisma.abonnement.update({
          where: { id: abonnement.id },
          data: {
            statut: "ANNULE",
            dateFin: new Date(),
          },
        });

        clearQuotaCache(abonnement.vendeurId);
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const abonnement = await prisma.abonnement.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (abonnement) {
        await prisma.abonnement.update({
          where: { id: abonnement.id },
          data: {
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });

        clearQuotaCache(abonnement.vendeurId);
      }
    }

    return new NextResponse("Webhook processed successfully", { status: 200 });
  } catch (err) {
    const message = errorMessage(err);
    console.error("Webhook event handling failed:", err);
    return new NextResponse(`Webhook Error: ${message}`, { status: 500 });
  }
}
