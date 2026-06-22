"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { auth } from "@/lib/auth";
import { generateCode } from "@/lib/utils";
import { generateAndSendOrderInvoice } from "@/server/services/order-fulfillment";
import { notifyBoutiqueOwner, notifyAdmins } from "@/server/services/notifications";
import { getPaytechConfig, createPaytechCheckout } from "@/lib/paytech";

const checkoutItemSchema = z.object({
  produitId: z.string().min(1),
  quantite: z.number().min(1),
  // Sent by the cart for optimistic display only. The server re-reads the
  // authoritative price from the DB and ignores this value (see below).
  prixUnitaire: z.number().min(0),
});

const checkoutSchema = z.object({
  nomClient: z.string().min(1, "Le nom est obligatoire"),
  prenomClient: z.string().min(1, "Le prénom est obligatoire"),
  emailClient: z.string().trim().toLowerCase().email("Email invalide"),
  // Téléphone au format international (indicatif pays inclus). On retire les
  // séparateurs avant de valider (ex. "+221 77 123 45 67" -> "+221771234567").
  telephoneClient: z
    .string()
    .transform((v) => v.replace(/[\s().-]/g, ""))
    .pipe(
      z
        .string()
        .regex(/^\+\d{8,15}$/, "Téléphone invalide (format international, ex. +221771234567)")
    ),
  adresseLivraison: z.string().min(3, "L'adresse de livraison est obligatoire"),
  ville: z.string().min(1, "La ville est obligatoire"),
  pays: z.string().min(1, "Le pays est obligatoire").default("Sénégal"),
  notes: z.string().max(1000).optional(),
  paymentMethod: z.enum([
    "WAVE",
    "ORANGE_MONEY",
    "CASH_ON_DELIVERY",
  ]),
  items: z.array(checkoutItemSchema).min(1, "Le panier ne peut pas être vide"),
});

export const createMarketplaceCommande = actionClient
  .schema(checkoutSchema)
  .action(async ({ parsedInput }) => {
    const {
      nomClient,
      prenomClient,
      emailClient,
      telephoneClient,
      adresseLivraison,
      ville,
      pays,
      notes,
      paymentMethod,
      items,
    } = parsedInput;

    // 1. Guest checkout : l'authentification n'est PAS requise. Si une session
    // existe, la commande est rattachée à l'utilisateur ; sinon userId reste null.
    const session = await auth();
    const buyerUserId: string | null = session?.user?.id ?? null;

    // Adresse complète stockée d'un seul tenant (ville + pays compris).
    const fullAddress = `${adresseLivraison}, ${ville}, ${pays}`;

    // Paiement à la livraison = commande honorée immédiatement (stock décrémenté
    // + facture émise). Pour les paiements EN LIGNE, on attend la confirmation
    // de la passerelle (IPN) avant de toucher au stock ou d'émettre la facture :
    // un paiement abandonné ne laisse ainsi ni stock fantôme ni fausse facture.
    const isInstant = paymentMethod === "CASH_ON_DELIVERY";

    // Config PayTech centralisée (mode sandbox/live, devise, URLs).
    const paytechConfig = getPaytechConfig();

    // 2. Group items by boutique
    const itemsWithBoutique = await Promise.all(
      items.map(async (item) => {
        const product = await prisma.produit.findUnique({
          where: { id: item.produitId },
          select: { boutiqueId: true, nom: true, quantite: true, prixUnitaire: true },
        });
        if (!product) {
          throw new Error(`Produit introuvable.`);
        }
        if (product.quantite < item.quantite) {
          throw new Error(`Stock insuffisant pour le produit: ${product.nom}`);
        }
        // Authoritative price: always take prixUnitaire from the DB, never the
        // client cart. Trusting the submitted price lets a tampered cart buy
        // real stock for an arbitrary amount (and charge that amount via PayTech).
        return {
          ...item,
          boutiqueId: product.boutiqueId,
          nom: product.nom,
          prixUnitaire: product.prixUnitaire,
        };
      })
    );

    const itemsByBoutique = itemsWithBoutique.reduce<Record<string, typeof itemsWithBoutique>>(
      (acc, item) => {
        if (!acc[item.boutiqueId]) acc[item.boutiqueId] = [];
        acc[item.boutiqueId]!.push(item);
        return acc;
      },
      {}
    );

    const createdCommandeIds: string[] = [];
    let totalAmount = 0;

    // 3. Persist orders + upsert Client per boutique
    await prisma.$transaction(async (tx) => {
      for (const [boutiqueId, boutiqueItems] of Object.entries(itemsByBoutique)) {
        // Find existing client deterministically: phone is the strongest identifier
        let client = await tx.client.findFirst({
          where: { boutiqueId, telephone: telephoneClient },
        });
        if (!client && emailClient) {
          client = await tx.client.findFirst({
            where: { boutiqueId, email: emailClient },
          });
        }

        if (client) {
          // Enrich client with any missing data from this order
          const updates: {
            nom?: string;
            prenom?: string;
            telephone?: string;
            email?: string;
            adresse?: string;
          } = {};
          if (!client.prenom && prenomClient) updates.prenom = prenomClient;
          if (!client.email && emailClient) updates.email = emailClient;
          if (!client.telephone && telephoneClient) updates.telephone = telephoneClient;
          if (!client.adresse && fullAddress) updates.adresse = fullAddress;
          if (Object.keys(updates).length > 0) {
            client = await tx.client.update({
              where: { id: client.id },
              data: updates,
            });
          }
        } else {
          client = await tx.client.create({
            data: {
              boutiqueId,
              nom: nomClient,
              prenom: prenomClient,
              telephone: telephoneClient,
              email: emailClient ?? null,
              adresse: fullAddress,
            },
          });
        }

        const orderCode = generateCode("CMD");
        const orderTotal = boutiqueItems.reduce(
          (sum, item) => sum + item.prixUnitaire * item.quantite,
          0
        );
        totalAmount += orderTotal;

        const order = await tx.commandeClient.create({
          data: {
            boutiqueId,
            clientId: client.id,
            userId: buyerUserId,
            code: orderCode,
            total: orderTotal,
            notes: notes || null,
            modePaiement: paymentMethod,
            statutPaiement: "EN_ATTENTE",
            etat: "EN_ATTENTE",
            // Audit du paiement en ligne (fournisseur, mode sandbox/live, devise).
            metadata: isInstant
              ? undefined
              : {
                  provider: "paytech",
                  mode: paytechConfig.sandbox ? "sandbox" : "live",
                  currency: paytechConfig.currency,
                },
          },
        });

        createdCommandeIds.push(order.id);

        for (const item of boutiqueItems) {
          await tx.ligneCommandeClient.create({
            data: {
              commandeId: order.id,
              produitId: item.produitId,
              quantite: item.quantite,
              prixUnitaire: item.prixUnitaire,
            },
          });

          // Stock décrémenté à la création UNIQUEMENT pour le paiement à la
          // livraison. Pour les paiements en ligne, la décrémentation a lieu à
          // la confirmation du paiement (voir confirmMarketplaceOrders).
          if (isInstant) {
            await tx.produit.update({
              where: { id: item.produitId },
              data: {
                quantite: { decrement: item.quantite },
              },
            });

            await tx.mouvementStock.create({
              data: {
                boutiqueId,
                produitId: item.produitId,
                type: "SORTIE",
                quantite: item.quantite,
                sourceType: "CommandeClient",
                sourceId: order.id,
              },
            });
          }
        }
      }
    });

    // 4. Facture + emails de confirmation : uniquement pour le paiement à la
    // livraison (commande honorée immédiatement). Pour les paiements en ligne,
    // c'est confirmMarketplaceOrders qui s'en charge après confirmation du paiement.
    if (isInstant) {
      for (const orderId of createdCommandeIds) {
        try {
          await generateAndSendOrderInvoice(orderId);
        } catch (err) {
          console.error(`[invoice-generation-failed] order ${orderId}:`, err);
        }
      }
    }

    // Notifications (best-effort) : prévenir le vendeur + les admins.
    try {
      const newOrders = await prisma.commandeClient.findMany({
        where: { id: { in: createdCommandeIds } },
        select: { code: true, total: true, boutiqueId: true },
      });
      for (const o of newOrders) {
        await notifyBoutiqueOwner(o.boutiqueId, {
          type: "NOUVELLE_COMMANDE",
          title: "Nouvelle commande",
          message: `Commande ${o.code} — ${o.total.toLocaleString("fr-FR")} FCFA`,
          link: `/boutiques/${o.boutiqueId}/commandes`,
        });
      }
      await notifyAdmins({
        type: "NOUVELLE_COMMANDE_MARKETPLACE",
        title: "Nouvelle commande marketplace",
        message: `${newOrders.length} commande(s) passée(s) sur la marketplace`,
        link: "/admin/dashboard",
      });
    } catch (err) {
      console.error("[notifications] nouvelle commande:", err);
    }

    // 4. Paiement en ligne via PayTech (Wave / Orange Money). Le paiement à la
    // livraison (CASH_ON_DELIVERY) a déjà été honoré plus haut. Toute la logique
    // d'appel passe par le service central `@/lib/paytech` (aucune duplication).
    if (paymentMethod === "WAVE" || paymentMethod === "ORANGE_MONEY") {
      if (
        !paytechConfig.enabled ||
        !paytechConfig.apiKey ||
        !paytechConfig.apiSecret
      ) {
        throw new Error(
          "Le paiement Mobile Money n'est pas activé ou configuré sur ce serveur."
        );
      }

      const transactionRef = `CMD-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)
        .toUpperCase()}`;

      const checkout = await createPaytechCheckout({
        itemName: `Commande GestionPro - ${createdCommandeIds.length} boutique${
          createdCommandeIds.length > 1 ? "s" : ""
        }`,
        amount: totalAmount,
        refCommand: transactionRef,
        commandName: "Achat sur la marketplace GestionPro",
        successUrl: `${paytechConfig.appUrl}/checkout/success?method=paytech&ids=${createdCommandeIds.join(",")}`,
        cancelUrl: `${paytechConfig.appUrl}/checkout/cancel?ids=${createdCommandeIds.join(",")}`,
        customField: {
          kind: "marketplace_order",
          commandeIds: createdCommandeIds.join(","),
        },
      });

      if (!checkout.success || !checkout.redirectUrl) {
        throw new Error(
          "Le paiement Mobile Money est temporairement indisponible. Réessayez ou choisissez le paiement à la livraison."
        );
      }

      // Trace du token PayTech sur les commandes (réconciliation à l'IPN).
      await prisma.commandeClient.updateMany({
        where: { id: { in: createdCommandeIds } },
        data: { paymentToken: checkout.token },
      });

      return {
        success: true,
        paymentUrl: checkout.redirectUrl,
        accountCreatedEmail: undefined,
      };
    }

    // Paiement à la livraison
    return {
      success: true,
      paymentUrl: `/checkout/success?method=cod&ids=${createdCommandeIds.join(",")}`,
      accountCreatedEmail: undefined,
    };
  });
