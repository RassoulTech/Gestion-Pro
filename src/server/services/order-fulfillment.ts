import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateInvoicePDF } from "@/lib/generate-invoice";
import { paymentMethodLabel } from "@/lib/payment-method";
import {
  sendOrderConfirmationToClient,
  sendOrderNotificationToVendedor,
} from "@/lib/mail";
import { notifyBoutiqueOwner } from "@/server/services/notifications";

/**
 * Génère la facture PDF d'une commande, l'archive sur la commande et envoie les
 * emails (confirmation client + notification vendeur). Best-effort : à appeler
 * dans un try/catch côté appelant — un échec ne doit pas annuler la commande.
 */
export async function generateAndSendOrderInvoice(orderId: string): Promise<void> {
  const order = await prisma.commandeClient.findUnique({
    where: { id: orderId },
    include: {
      client: true,
      boutique: { include: { vendeur: true } },
      lignes: { include: { produit: true } },
    },
  });

  if (!order || !order.client) return;

  // Numéro stable : on RÉUTILISE le numéro déjà émis (rejeu d'IPN, renvoi
  // manuel) au lieu d'en dériver un nouveau de la date du jour.
  const dateSuffix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const invoiceNumber = order.invoiceNumber || `FAC-${dateSuffix}-${order.code.substring(4)}`;

  const doc = await generateInvoicePDF({
    invoiceNumber,
    date: new Date(),
    status: order.etat,
    boutique: {
      nom: order.boutique.nom,
      logo: order.boutique.logo,
      telephone: order.boutique.telephone,
      email: order.boutique.email,
      adresse: order.boutique.adresse,
    },
    client: {
      nom: order.client.nom,
      prenom: order.client.prenom,
      telephone: order.client.telephone,
      email: order.client.email,
      adresse: order.client.adresse,
    },
    lignes: order.lignes.map((line) => ({
      nom: line.produit.nom,
      quantite: line.quantite,
      prixUnitaire: line.prixUnitaire,
    })),
    total: order.total,
    remise: order.remise,
    modePaiement: paymentMethodLabel(order.modePaiement),
    settings: order.boutique.factureSettings,
  });

  const pdfBase64 = doc.output("datauristring").split(",")[1] || "";
  const pdfBuffer = Buffer.from(pdfBase64, "base64");

  await prisma.commandeClient.update({
    where: { id: order.id },
    data: {
      invoiceNumber,
      invoicePdfUrl: `data:application/pdf;base64,${pdfBase64}`,
    },
  });

  if (order.client.email) {
    await sendOrderConfirmationToClient(
      order.client.email,
      order.client.nom,
      order.code,
      order.total,
      pdfBuffer
    );
  }

  if (order.boutique.vendeur.email) {
    const vendorName = `${order.boutique.vendeur.prenom} ${order.boutique.vendeur.nom}`;
    await sendOrderNotificationToVendedor(
      order.boutique.vendeur.email,
      vendorName,
      order.boutique.nom,
      order.code,
      order.total,
      order.client.nom,
      order.client.telephone || "N/A"
    );
  }
}

interface ConfirmOptions {
  modePaiement?: string;
  paymentToken?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Confirme des commandes marketplace après un paiement en ligne réussi.
 *
 * Point d'entrée UNIQUE pour la confirmation de paiement (IPN PayTech).
 * Pour chaque commande non encore CONFIRME :
 *   1. décrémente le stock et journalise le mouvement (SORTIE) ;
 *   2. passe la commande en CONFIRME / VALIDEE ;
 *   3. génère la facture et envoie les emails.
 *
 * Idempotent et sûr face aux rejeux : la « prise » du statut se fait via un
 * updateMany conditionnel (`statutPaiement != CONFIRME`) ; seules les commandes
 * réellement basculées par CET appel voient leur stock décrémenté. Un rejeu
 * d'IPN ne décrémente donc jamais deux fois.
 *
 * @returns le nombre de commandes nouvellement confirmées par cet appel
 */
export async function confirmMarketplaceOrders(
  commandeIds: string[],
  opts: ConfirmOptions = {}
): Promise<number> {
  if (commandeIds.length === 0) return 0;

  const claimedIds = await prisma.$transaction(async (tx) => {
    const claimed: string[] = [];

    for (const id of commandeIds) {
      // Prise atomique : ne bascule que si la commande n'est pas déjà CONFIRME.
      const claim = await tx.commandeClient.updateMany({
        where: { id, statutPaiement: { not: "CONFIRME" } },
        data: {
          statutPaiement: "CONFIRME",
          etat: "VALIDEE",
          ...(opts.modePaiement ? { modePaiement: opts.modePaiement } : {}),
          ...(opts.paymentToken ? { paymentToken: opts.paymentToken } : {}),
          ...(opts.metadata ? { metadata: opts.metadata } : {}),
        },
      });
      if (claim.count === 1) claimed.push(id);
    }

    // Décrémentation du stock uniquement pour les commandes prises par cet appel.
    if (claimed.length > 0) {
      const orders = await tx.commandeClient.findMany({
        where: { id: { in: claimed } },
        include: { lignes: true },
      });

      for (const order of orders) {
        for (const ligne of order.lignes) {
          await tx.produit.update({
            where: { id: ligne.produitId },
            data: { quantite: { decrement: ligne.quantite } },
          });
          await tx.mouvementStock.create({
            data: {
              boutiqueId: order.boutiqueId,
              produitId: ligne.produitId,
              type: "SORTIE",
              quantite: ligne.quantite,
              sourceType: "CommandeClient",
              sourceId: order.id,
            },
          });
        }
      }
    }

    return claimed;
  });

  // Facture + emails hors transaction (best-effort, n'invalide pas la confirmation).
  for (const id of claimedIds) {
    try {
      await generateAndSendOrderInvoice(id);
    } catch (err) {
      console.error(`[order-fulfillment] facture/email échoués pour ${id}:`, err);
    }
  }

  // Notification "paiement confirmé" au vendeur (best-effort).
  if (claimedIds.length > 0) {
    try {
      const confirmed = await prisma.commandeClient.findMany({
        where: { id: { in: claimedIds } },
        select: { boutiqueId: true, code: true, total: true },
      });
      for (const o of confirmed) {
        await notifyBoutiqueOwner(o.boutiqueId, {
          type: "PAIEMENT_CONFIRME",
          title: "Paiement reçu",
          message: `Commande ${o.code} payée — ${o.total.toLocaleString("fr-FR")} FCFA`,
          link: `/boutiques/${o.boutiqueId}/commandes`,
        });
      }
    } catch (err) {
      console.error("[notifications] paiement confirmé:", err);
    }
  }

  return claimedIds.length;
}
