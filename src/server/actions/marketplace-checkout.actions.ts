"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { auth } from "@/lib/auth";
import { generateCode } from "@/lib/utils";
import { generateInvoicePDF } from "@/lib/generate-invoice";
import { sendOrderConfirmationToClient, sendOrderNotificationToVendedor } from "@/lib/mail";

const checkoutItemSchema = z.object({
  produitId: z.string().min(1),
  quantite: z.number().min(1),
  prixUnitaire: z.number().min(0),
});

const checkoutSchema = z.object({
  nomClient: z.string().min(1, "Le nom est obligatoire"),
  emailClient: z.string().email("Email invalide"),
  telephoneClient: z.string().min(8, "Le numéro de téléphone est obligatoire"),
  adresseLivraison: z.string().min(3, "L'adresse de livraison est obligatoire"),
  notes: z.string().optional(),
  paymentMethod: z.enum([
    "WAVE",
    "ORANGE_MONEY",
    "PAYPAL",
    "STRIPE",
    "CASH_ON_DELIVERY",
  ]),
  items: z.array(checkoutItemSchema).min(1, "Le panier ne peut pas être vide"),
});

export const createMarketplaceCommande = actionClient
  .schema(checkoutSchema)
  .action(async ({ parsedInput }) => {
    const {
      nomClient,
      emailClient,
      telephoneClient,
      adresseLivraison,
      notes,
      paymentMethod,
      items,
    } = parsedInput;

    // 1. Enforce active customer authentication
    const session = await auth();
    const existingUserId: string | null = session?.user?.id ?? null;
    if (!existingUserId) {
      throw new Error("Vous devez obligatoirement être connecté pour passer une commande.");
    }

    // 2. Group items by boutique
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
        return { ...item, boutiqueId: product.boutiqueId, nom: product.nom };
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
    const buyerUserId = existingUserId;

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
            telephone?: string;
            email?: string;
            adresse?: string;
          } = {};
          if (!client.email && emailClient) updates.email = emailClient;
          if (!client.telephone && telephoneClient) updates.telephone = telephoneClient;
          if (!client.adresse && adresseLivraison) updates.adresse = adresseLivraison;
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
              telephone: telephoneClient,
              email: emailClient ?? null,
              adresse: adresseLivraison,
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
    });

    // 4. Generate professional invoice PDFs and send confirmation/notification emails
    for (const orderId of createdCommandeIds) {
      try {
        const order = await prisma.commandeClient.findUnique({
          where: { id: orderId },
          include: {
            client: true,
            boutique: {
              include: {
                vendeur: true
              }
            },
            lignes: {
              include: {
                produit: true
              }
            }
          }
        });

        if (order && order.client) {
          const dateSuffix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
          const invoiceNumber = `FAC-${dateSuffix}-${order.code.substring(4)}`;
          
          const invoiceData = {
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
            lignes: order.lignes.map(line => ({
              nom: line.produit.nom,
              quantite: line.quantite,
              prixUnitaire: line.prixUnitaire,
            })),
            total: order.total,
            remise: order.remise,
          };

          const doc = generateInvoicePDF(invoiceData);
          const pdfBase64 = doc.output("datauristring").split(",")[1] || "";
          const pdfBuffer = Buffer.from(pdfBase64, "base64");

          // Store invoice number and fake invoice PDF URL inside database
          await prisma.commandeClient.update({
            where: { id: order.id },
            data: {
              invoiceNumber,
              invoicePdfUrl: `data:application/pdf;base64,${pdfBase64}`,
            }
          });

          // Send Email to Client with PDF attachment
          if (order.client.email) {
            await sendOrderConfirmationToClient(
              order.client.email,
              order.client.nom,
              order.code,
              order.total,
              pdfBuffer
            );
          }

          // Send Email to Shop Owner (vendeur)
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
      } catch (err) {
        console.error(`[invoice-generation-failed] Failed to generate/send invoice for order ${orderId}:`, err);
      }
    }

    // 4. Initiate payment processing based on selected method
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (paymentMethod === "STRIPE") {
      const stripeEnabled = process.env.STRIPE_ENABLED === "true";
      const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
      const stripeConfigured =
        stripeEnabled && stripeSecret.length > 0 && !stripeSecret.includes("mock");

      if (!stripeConfigured) {
        const transactionRef = `CMD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
        await prisma.commandeClient.updateMany({
          where: { id: { in: createdCommandeIds } },
          data: { paymentToken: transactionRef },
        });
        return {
          success: true,
          paymentUrl: `/checkout/mock/order?ref=${transactionRef}&amount=${totalAmount}&method=STRIPE&ids=${createdCommandeIds.join(",")}`,
          accountCreatedEmail: undefined,
        };
      }

      const stripe = (await import("@/lib/stripe")).getStripe();

      const stripeSession = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "xof",
              product_data: {
                name: `Commande sur GestionPro`,
                description: `Règlement des achats clients (${createdCommandeIds.length} boutiques)`,
              },
              unit_amount: Math.round(totalAmount),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${appUrl}/checkout/success?success=true&method=stripe&ids=${createdCommandeIds.join(",")}`,
        cancel_url: `${appUrl}/panier`,
        customer_email: emailClient,
        metadata: {
          type: "marketplace_order",
          commandeIds: createdCommandeIds.join(","),
        },
      });

      await prisma.commandeClient.updateMany({
        where: { id: { in: createdCommandeIds } },
        data: { paymentToken: stripeSession.id },
      });

      return {
        success: true,
        paymentUrl: stripeSession.url || undefined,
        accountCreatedEmail: undefined,
      };
    }

    if (paymentMethod === "WAVE" || paymentMethod === "ORANGE_MONEY") {
      const transactionRef = `CMD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      const pdMaster = process.env.PAYDUNYA_MASTER_KEY || "";
      const paydunyaConfigured =
        process.env.PAYDUNYA_ENABLED === "true" &&
        pdMaster.length > 0 &&
        !pdMaster.includes("mock");

      if (paydunyaConfigured) {
        const { PayDunyaClient, extractPayDunyaCheckoutUrl } = await import(
          "@/lib/paydunya"
        );

        const pdResponse = await PayDunyaClient.initiateInvoice({
          transactionId: transactionRef,
          amount: totalAmount,
          description: `Commande GestionPro - ${createdCommandeIds.length} boutique${createdCommandeIds.length > 1 ? "s" : ""}`,
          cancelUrl: `${appUrl}/panier`,
          returnUrl: `${appUrl}/checkout/success?success=true&method=paydunya&ids=${createdCommandeIds.join(",")}`,
          callbackUrl: `${appUrl}/api/webhooks/paydunya`,
          customerName: nomClient,
          customerEmail: emailClient,
          customerPhone: telephoneClient,
          customData: {
            kind: "marketplace_order",
            commandeIds: createdCommandeIds.join(","),
            transactionRef,
          },
        });

        const checkoutUrl = extractPayDunyaCheckoutUrl(pdResponse);

        if (checkoutUrl && pdResponse.token) {
          await prisma.commandeClient.updateMany({
            where: { id: { in: createdCommandeIds } },
            data: { paymentToken: pdResponse.token },
          });

          return {
            success: true,
            paymentUrl: checkoutUrl,
            accountCreatedEmail: undefined,
          };
        }

        console.error("PayDunya marketplace API error :", pdResponse);
      }

      await prisma.commandeClient.updateMany({
        where: { id: { in: createdCommandeIds } },
        data: { paymentToken: transactionRef },
      });

      return {
        success: true,
        paymentUrl: `/checkout/mock/order?ref=${transactionRef}&amount=${totalAmount}&method=${paymentMethod}&ids=${createdCommandeIds.join(",")}`,
        accountCreatedEmail: undefined,
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
        accountCreatedEmail: undefined,
      };
    }

    // Cash on Delivery
    return {
      success: true,
      paymentUrl: `/checkout/success?success=true&method=cod&ids=${createdCommandeIds.join(",")}`,
      accountCreatedEmail: undefined,
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
