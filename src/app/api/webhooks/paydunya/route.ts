import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { PayDunyaClient } from "@/lib/paydunya";
import { PaymentService } from "@/server/services/payment.service";
import { prisma } from "@/lib/prisma";
import { clearQuotaCache } from "@/lib/quotas";

interface PayDunyaPayload {
  invoice?: { token?: string };
  token?: string;
  hash?: string;
}

/**
 * Best-effort body parser. PayDunya posts as `application/x-www-form-urlencoded`
 * for real IPNs, but may send empty/odd content-types when verifying the URL
 * (the dashboard "save IPN" hits the endpoint to check it responds). Read the
 * raw text and try JSON → form-encoded; never let req.formData() throw on a
 * mismatched Content-Type.
 */
async function extractPayload(req: Request): Promise<{ token: string; hash?: string }> {
  const raw = await req.text().catch(() => "");
  if (!raw) return { token: "" };

  const tryParseDataJson = (s: string): { token: string; hash?: string } | null => {
    try {
      const parsed = JSON.parse(s) as PayDunyaPayload & {
        data?: PayDunyaPayload;
      };
      const data = parsed.data ?? parsed;
      const token = data.invoice?.token || data.token || "";
      const hash = data.hash || parsed.hash;
      return token ? { token, hash } : null;
    } catch {
      return null;
    }
  };

  // 1) Try the whole body as JSON
  const asJson = tryParseDataJson(raw);
  if (asJson) return asJson;

  // 2) Try as URL-encoded form (real PayDunya IPN format)
  try {
    const params = new URLSearchParams(raw);
    const dataField = params.get("data");
    if (dataField) {
      const fromData = tryParseDataJson(dataField);
      if (fromData) return fromData;
    }
    const token =
      params.get("invoice_token") || params.get("token") || "";
    const hash = params.get("hash") || undefined;
    if (token) return { token, hash };
  } catch {
    // fall through
  }

  return { token: "" };
}

/**
 * PayDunya IPN handler.
 *
 * PayDunya posts the invoice token, status and custom_data (form-urlencoded
 * by default). We always re-verify by calling the confirm endpoint with the
 * token before mutating subscription / order state — never trust the payload
 * alone. URL-verification pings (no token) return 200 so PayDunya keeps the
 * URL registered.
 */
export async function POST(req: Request) {
  try {
    const { token, hash: receivedHash } = await extractPayload(req);

    if (!token) {
      // Likely PayDunya's IPN URL verification ping (sent when you save the
      // URL in the dashboard). Respond 200 so they keep the endpoint live.
      return new NextResponse("OK (no token, treated as verification ping)", {
        status: 200,
      });
    }

    // Verify the IPN signature before doing anything else. In dev/mock mode
    // (no MASTER_KEY configured) this is a no-op so sandbox flows keep working.
    if (!PayDunyaClient.verifyIpnHash(receivedHash)) {
      console.warn(`PayDunya webhook: invalid hash for token ${token}`);
      return new NextResponse("Invalid signature", { status: 401 });
    }

    // Verify the IPN signature before doing anything else. In dev/mock mode
    // (no MASTER_KEY configured) this is a no-op so sandbox flows keep working.
    if (!PayDunyaClient.verifyIpnHash(receivedHash)) {
      console.warn(`PayDunya webhook: invalid hash for token ${token}`);
      return new NextResponse("Invalid signature", { status: 401 });
    }

    // Re-verify with PayDunya to avoid spoofed callbacks
    const verification = await PayDunyaClient.confirmInvoice(token);

    const isAccepted =
      verification.response_code === "00" && verification.status === "completed";

    if (!isAccepted) {
      // Never downgrade an order/payment that has already been confirmed —
      // a delayed FAILED webhook must not overwrite a successful state.
      const matchingOrders = await prisma.commandeClient.findMany({
        where: { paymentToken: token, statutPaiement: "EN_ATTENTE" },
        select: { id: true },
      });

      if (matchingOrders.length > 0) {
        await prisma.commandeClient.updateMany({
          where: { id: { in: matchingOrders.map((o) => o.id) } },
          data: { statutPaiement: "ECHOUE" },
        });
      } else {
        const payment = await prisma.paiement.findFirst({
          where: { paydunyaToken: token },
        });
        if (payment?.transactionRef) {
          // handlePaymentWebhook is idempotent — it refuses to downgrade a
          // payment that's already CONFIRME.
          await PaymentService.handlePaymentWebhook(payment.transactionRef, "FAILED");
        }
      }

      console.log(`PayDunya payment not accepted (token=${token}, status=${verification.status})`);
      return new NextResponse("Payment failed / not accepted", { status: 200 });
    }

    // Marketplace orders path — only confirm orders still pending. Replays on
    // an already-confirmed order are no-ops (idempotent).
    const orders = await prisma.commandeClient.findMany({
      where: { paymentToken: token, statutPaiement: "EN_ATTENTE" },
    });

    if (orders.length > 0) {
      await prisma.commandeClient.updateMany({
        where: { id: { in: orders.map((o) => o.id) } },
        data: {
          statutPaiement: "CONFIRME",
          etat: "VALIDEE",
          metadata: verification as unknown as Prisma.InputJsonValue,
        },
      });
      console.log(`PayDunya marketplace orders for token ${token} confirmed.`);
      return new NextResponse("Marketplace orders confirmed", { status: 200 });
    }

    // If we found orders but they're all already confirmed, exit idempotently
    // before falling through to the subscription path.
    const anyOrder = await prisma.commandeClient.findFirst({
      where: { paymentToken: token },
      select: { id: true },
    });
    if (anyOrder) {
      return new NextResponse("Marketplace orders already confirmed", { status: 200 });
    }

    // SaaS subscription path
    const payment = await prisma.paiement.findFirst({
      where: { paydunyaToken: token },
      include: { abonnement: true },
    });

    if (!payment?.transactionRef) {
      console.warn(`PayDunya webhook: no matching payment for token ${token}`);
      return new NextResponse("No matching payment", { status: 200 });
    }

    const result = await PaymentService.handlePaymentWebhook(payment.transactionRef, "SUCCESS");

    if (result.success && payment.abonnement) {
      const vendeurId = payment.abonnement.vendeurId;
      const activeAbonnementId = payment.abonnementId;

      await prisma.abonnement.updateMany({
        where: {
          vendeurId,
          id: { not: activeAbonnementId },
          statut: { in: ["ESSAI", "ACTIF", "EN_ATTENTE"] },
        },
        data: {
          statut: "ANNULE",
          dateFin: new Date(),
        },
      });

      clearQuotaCache(vendeurId);
    }

    console.log(`PayDunya subscription payment confirmed for token ${token}`);
    return new NextResponse("Payment confirmed", { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("PayDunya webhook processing error:", error);
    return new NextResponse(`Error: ${message}`, { status: 500 });
  }
}
