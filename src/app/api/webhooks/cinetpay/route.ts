import { NextResponse } from "next/server";
import { CinetPayClient } from "@/lib/cinetpay";
import { PaymentService } from "@/server/services/payment.service";
import { prisma } from "@/lib/prisma";
import { clearQuotaCache } from "@/lib/quotas";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let transactionId = "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      transactionId = formData.get("cpay_transaction_id")?.toString() || "";
    } else {
      const body = await req.json().catch(() => ({}));
      transactionId = body.cpay_transaction_id || body.transaction_id || "";
    }

    if (!transactionId) {
      return new NextResponse("Transaction ID missing", { status: 400 });
    }

    // Double-verification with CinetPay check endpoint to avoid signature spoofing
    const verification = await CinetPayClient.verifyPayment(transactionId);

    // If verification succeeded and status is ACCEPTED
    if (
      verification &&
      verification.code === "00" &&
      verification.data &&
      verification.data.status === "ACCEPTED"
    ) {
      // Check if transactionId belongs to a CommandeClient payment token
      const orders = await prisma.commandeClient.findMany({
        where: { paymentToken: transactionId },
      });

      if (orders.length > 0) {
        await prisma.commandeClient.updateMany({
          where: { id: { in: orders.map((o) => o.id) } },
          data: {
            statutPaiement: "CONFIRME",
            etat: "VALIDEE",
            metadata: JSON.parse(JSON.stringify(verification.data)),
          },
        });
        console.log(`CinetPay marketplace orders for transaction ${transactionId} confirmed successfully!`);
        return new NextResponse("Marketplace orders confirmed", { status: 200 });
      }

      // Complete subscription payment in our system
      const result = await PaymentService.handlePaymentWebhook(transactionId, "SUCCESS");

      if (result.success) {
        // Find the payment to get the vendeur ID and deactivate others
        const payment = await prisma.paiement.findFirst({
          where: { transactionRef: transactionId },
          include: { abonnement: true },
        });

        if (payment && payment.abonnement) {
          const vendeurId = payment.abonnement.vendeurId;
          const activeAbonnementId = payment.abonnementId;

          // Deactivate other active/trial abonnements of this vendeur to prevent overlap
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

          // Invalidate cache
          clearQuotaCache(vendeurId);
        }

        console.log(`CinetPay payment success webhook processed for transaction: ${transactionId}`);
        return new NextResponse("Payment confirmed", { status: 200 });
      }
    } else {
      // Mark as failed in our DB
      await PaymentService.handlePaymentWebhook(transactionId, "FAILED");
      console.log(`CinetPay payment failed webhook processed for transaction: ${transactionId}`);
      return new NextResponse("Payment failed / not accepted", { status: 200 });
    }

    return new NextResponse("Webhook processed", { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("CinetPay webhook processing error:", error);
    return new NextResponse(`Error: ${message}`, { status: 500 });
  }
}
