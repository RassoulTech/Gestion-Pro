import { NextResponse } from "next/server";
import { PaymentService } from "@/server/services/payment.service";

/**
 * Routeur d'écoute des Webhooks (CinetPay, FedaPay, PayTech, PayPal)
 * POST /api/webhooks/payment
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ─── EXEMPLE D'EXTRACTION DE LA TRANSACTION ───────────────────
    // Chaque passerelle a un format de payload spécifique :
    // 
    // 1) CinetPay :
    //    const transactionId = body.cpay_custom; // ou body.transaction_id
    //    const status = body.status === "ACCEPTED" ? "SUCCESS" : "FAILED";
    //
    // 2) FedaPay :
    //    const transactionId = body.entity?.reference;
    //    const status = body.event === "transaction.approved" ? "SUCCESS" : "FAILED";

    const transactionId = body.transaction_id || body.cpay_custom || body.reference;
    const status = body.status === "SUCCESS" || body.event === "transaction.approved" ? "SUCCESS" : "FAILED";

    if (!transactionId) {
      return NextResponse.json({ error: "Référence de transaction manquante dans le payload." }, { status: 400 });
    }

    const result = await PaymentService.handlePaymentWebhook(transactionId, status);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Erreur Webhook Paiement :", error);
    return NextResponse.json({ error: error.message || "Erreur interne" }, { status: 500 });
  }
}
