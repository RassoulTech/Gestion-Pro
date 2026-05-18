"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { generateCode } from "@/lib/utils";

const checkoutItemSchema = z.object({
  produitId: z.string().min(1),
  quantite: z.number().min(1),
  prixUnitaire: z.number().min(0),
});

export const createMarketplaceCommande = actionClient
  .schema(
    z.object({
      nomClient: z.string().min(1, "Le nom est obligatoire"),
      telephoneClient: z.string().min(8, "Le numéro de téléphone est obligatoire"),
      adresseLivraison: z.string().min(3, "L'adresse de livraison est obligatoire"),
      notes: z.string().optional(),
      paymentMethod: z.enum(["WAVE", "ORANGE_MONEY", "PAYPAL", "STRIPE", "CASH_ON_DELIVERY"]),
      items: z.array(checkoutItemSchema).min(1, "Le panier ne peut pas être vide"),
    })
  )
  .action(async ({ parsedInput }) => {
    const { nomClient, telephoneClient, adresseLivraison, notes, paymentMethod, items } = parsedInput;

    // 1. Group items by boutiqueId to handle multi-vendor carts cleanly
    const itemsWithBoutique = await Promise.all(
      items.map(async (item) => {
        const product = await prisma.produit.findUnique({
          where: { id: item.produitId },
          select: { boutiqueId: true, nom: true, quantite: true },
        });
        if (!product) {
          throw new Error(`Produit introuvable.`);
        }
        if (product.quantite < item.quantite) {
          throw new Error(`Stock insuffisant pour le produit: ${product.nom}`);
        }
        return { ...item, boutiqueId: product.boutiqueId };
      })
    );

    const itemsByBoutique = itemsWithBoutique.reduce<Record<string, typeof itemsWithBoutique>>((acc, item) => {
      if (!acc[item.boutiqueId]) {
        acc[item.boutiqueId] = [];
      }
      acc[item.boutiqueId]!.push(item);
      return acc;
    }, {});

    const createdCommandeIds: string[] = [];
    let totalAmount = 0;

    // 2. Process transaction for each boutique group
    await prisma.$transaction(async (tx) => {
      for (const [boutiqueId, boutiqueItems] of Object.entries(itemsByBoutique)) {
        // Find or create Client inside this boutique
        let client = await tx.client.findFirst({
          where: {
            boutiqueId,
            telephone: telephoneClient,
          },
        });

        if (!client) {
          client = await tx.client.create({
            data: {
              boutiqueId,
              nom: nomClient,
              telephone: telephoneClient,
              adresse: adresseLivraison,
            },
          });
        }

        const orderCode = generateCode("CMD");
        const orderTotal = boutiqueItems.reduce((sum, item) => sum + item.prixUnitaire * item.quantite, 0);
        totalAmount += orderTotal;

        const order = await tx.commandeClient.create({
          data: {
            boutiqueId,
            clientId: client.id,
            code: orderCode,
            total: orderTotal,
            notes: notes || null,
            modePaiement: paymentMethod,
            statutPaiement: "EN_ATTENTE",
            etat: "EN_ATTENTE",
          },
        });

        createdCommandeIds.push(order.id);

        // Process lines and update stock
        for (const item of boutiqueItems) {
          await tx.ligneCommandeClient.create({
            data: {
              commandeId: order.id,
              produitId: item.produitId,
              quantite: item.quantite,
              prixUnitaire: item.prixUnitaire,
            },
          });

          await tx.produit.update({
            where: { id: item.produitId },
            data: {
              quantite: {
                decrement: item.quantite,
              },
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
    });

    // 3. Initiate payment processing based on selected method
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (paymentMethod === "STRIPE") {
      const stripe = (await import("@/lib/stripe")).stripe;

      // Create Stripe checkout session for one-time order payment
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "xof",
              product_data: {
                name: `Commande sur GestionPro`,
                description: `Règlement des achats clients (${createdCommandeIds.length} boutiques)`,
              },
              unit_amount: Math.round(totalAmount), // Zero-decimal currency
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${appUrl}/checkout/success?success=true&method=stripe&ids=${createdCommandeIds.join(",")}`,
        cancel_url: `${appUrl}/panier`,
        metadata: {
          type: "marketplace_order",
          commandeIds: createdCommandeIds.join(","),
        },
      });

      // Update paymentToken on the commands
      await prisma.commandeClient.updateMany({
        where: { id: { in: createdCommandeIds } },
        data: { paymentToken: session.id },
      });

      return {
        success: true,
        paymentUrl: session.url || undefined,
      };
    }

    if (paymentMethod === "WAVE" || paymentMethod === "ORANGE_MONEY") {
      const transactionRef = `CMD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      if (process.env.CINETPAY_ENABLED === "true") {
        const { CinetPayClient } = await import("@/lib/cinetpay");

        const cpResponse = await CinetPayClient.initiatePayment({
          transactionId: transactionRef,
          amount: totalAmount,
          currency: "XOF",
          description: `Commande GestionPro - ${createdCommandeIds.length} boutiques`,
          notifyUrl: `${appUrl}/api/webhooks/cinetpay`,
          returnUrl: `${appUrl}/checkout/success?success=true&method=cinetpay&ids=${createdCommandeIds.join(",")}`,
          channels: "MOBILE_MONEY",
        });

        if (cpResponse.code === "201" && cpResponse.data) {
          await prisma.commandeClient.updateMany({
            where: { id: { in: createdCommandeIds } },
            data: { paymentToken: cpResponse.data.payment_token },
          });

          return {
            success: true,
            paymentUrl: cpResponse.data.payment_url,
          };
        }
      }

      // Default sandbox simulation for test mobile money payments
      await prisma.commandeClient.updateMany({
        where: { id: { in: createdCommandeIds } },
        data: { paymentToken: transactionRef },
      });

      return {
        success: true,
        paymentUrl: `/checkout/mock/order?ref=${transactionRef}&amount=${totalAmount}&method=${paymentMethod}&ids=${createdCommandeIds.join(",")}`,
      };
    }

    if (paymentMethod === "PAYPAL") {
      const transactionRef = `CMD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      await prisma.commandeClient.updateMany({
        where: { id: { in: createdCommandeIds } },
        data: { paymentToken: transactionRef },
      });

      return {
        success: true,
        paymentUrl: `/checkout/mock/order?ref=${transactionRef}&amount=${totalAmount}&method=PAYPAL&ids=${createdCommandeIds.join(",")}`,
      };
    }

    // Cash on Delivery
    return {
      success: true,
      paymentUrl: `/checkout/success?success=true&method=cod&ids=${createdCommandeIds.join(",")}`,
    };
  });

export const confirmMockOrderPayment = actionClient
  .schema(
    z.object({
      ids: z.string().min(1),
      transactionRef: z.string().min(1),
    })
  )
  .action(async ({ parsedInput }) => {
    const { ids, transactionRef } = parsedInput;
    const commandeIds = ids.split(",");

    await prisma.commandeClient.updateMany({
      where: { id: { in: commandeIds } },
      data: {
        statutPaiement: "CONFIRME",
        etat: "VALIDEE",
      },
    });

    console.log(`Mock order payment confirmed for orders: ${ids} (ref: ${transactionRef})`);

    return {
      success: true,
    };
  });

