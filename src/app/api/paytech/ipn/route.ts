import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      type_event,
      ref_command,
      api_key_sha256,
      api_secret_sha256,
      payment_method,
      token,
      custom_field
    } = body;

    console.log(`PayTech IPN received: ${type_event} for ref ${ref_command}`);

    // 1. Validation de la signature SHA-256 d'après la spécification PayTech.
    // Sans clés configurées, sha256("") validerait la signature d'un attaquant
    // qui connaît la misconfiguration — on refuse explicitement.
    const apiKey = process.env.PAYTECH_API_KEY;
    const apiSecret = process.env.PAYTECH_API_SECRET;
    if (!apiKey || !apiSecret) {
      console.error("PayTech IPN: PAYTECH_API_KEY / PAYTECH_API_SECRET non configurés");
      return NextResponse.json(
        { error: "PayTech n'est pas configuré sur ce serveur" },
        { status: 503 }
      );
    }

    const localApiKeySha = crypto.createHash("sha256").update(apiKey).digest("hex");
    const localApiSecretSha = crypto.createHash("sha256").update(apiSecret).digest("hex");

    const safeEqual = (received: unknown, expected: string) => {
      const a = Buffer.from(String(received ?? ""), "utf8");
      const b = Buffer.from(expected, "utf8");
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    };

    if (!safeEqual(api_key_sha256, localApiKeySha) || !safeEqual(api_secret_sha256, localApiSecretSha)) {
      console.warn("PayTech IPN signature verification failed!");
      return NextResponse.json(
        { error: "Signature de notification invalide ou non authentifiée" },
        { status: 401 }
      );
    }

    // 2. Traitement selon l'événement d'achat
    if (type_event === "sale_complete") {
      let isSubscription = false;
      let subscriptionRef = "";
      let commandeIds: string[] = [];

      // Décoder les métadonnées passées dans custom_field
      if (custom_field) {
        try {
          const customData = JSON.parse(custom_field);
          if (customData.kind === "subscription") {
            isSubscription = true;
            subscriptionRef = customData.transactionRef || ref_command;
          } else if (customData.commandeIds) {
            commandeIds = customData.commandeIds.split(",");
          }
        } catch (e) {
          console.error("Failed to parse custom_field JSON in PayTech IPN:", e);
        }
      }

      // Si le custom_field n'indique rien mais que ref_command commence par "SUB-", c'est un abonnement
      if (!isSubscription && ref_command && ref_command.startsWith("SUB-")) {
        isSubscription = true;
        subscriptionRef = ref_command;
      }

      if (isSubscription && subscriptionRef) {
        const { PaymentService } = await import("@/server/services/payment.service");
        const result = await PaymentService.handlePaymentWebhook(subscriptionRef, "SUCCESS");
        console.log(`PayTech IPN subscription processing result for ${subscriptionRef}:`, result);
      } else if (commandeIds.length > 0) {
        // Mettre à jour toutes les commandes associées
        // Payé ≠ livré : la commande passe en VALIDEE, la livraison reste
        // une étape distincte gérée par le vendeur.
        await prisma.commandeClient.updateMany({
          where: { id: { in: commandeIds } },
          data: {
            statutPaiement: "CONFIRME",
            etat: "VALIDEE",
            modePaiement: payment_method || "PAYTECH",
            paymentToken: token || ref_command
          }
        });
        console.log(`Successfully confirmed orders in database: ${commandeIds.join(",")}`);
      } else {
        // Fallback s'il n'y a pas de custom_field mais que ref_command correspond au code de commande
        const order = await prisma.commandeClient.findFirst({
          where: { code: ref_command }
        });

        if (order) {
          await prisma.commandeClient.update({
            where: { id: order.id },
            data: {
              statutPaiement: "CONFIRME",
              etat: "VALIDEE",
              modePaiement: payment_method || "PAYTECH",
              paymentToken: token || ref_command
            }
          });
          console.log(`Successfully confirmed single order by ref_command: ${ref_command}`);
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing PayTech IPN:", error);
    const message =
      error instanceof Error ? error.message : "Erreur lors du traitement de l'IPN";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
