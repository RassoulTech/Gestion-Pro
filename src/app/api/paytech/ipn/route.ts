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

    // 1. Validation de la signature SHA-256 d'après la spécification PayTech
    const localApiKeySha = crypto
      .createHash("sha256")
      .update(process.env.PAYTECH_API_KEY || "")
      .digest("hex");

    const localApiSecretSha = crypto
      .createHash("sha256")
      .update(process.env.PAYTECH_API_SECRET || "")
      .digest("hex");

    if (api_key_sha256 !== localApiKeySha || api_secret_sha256 !== localApiSecretSha) {
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
        await prisma.commandeClient.updateMany({
          where: { id: { in: commandeIds } },
          data: {
            statutPaiement: "CONFIRME",
            etat: "LIVREE", // ou VALIDEE selon les états définis
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
              etat: "LIVREE",
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
  } catch (error: any) {
    console.error("Error processing PayTech IPN:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors du traitement de l'IPN" },
      { status: 500 }
    );
  }
}
