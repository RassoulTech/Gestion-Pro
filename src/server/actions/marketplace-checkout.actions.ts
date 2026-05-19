"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { auth } from "@/lib/auth";
import { generateCode } from "@/lib/utils";

const checkoutItemSchema = z.object({
  produitId: z.string().min(1),
  quantite: z.number().min(1),
  prixUnitaire: z.number().min(0),
});

const checkoutSchema = z
  .object({
    nomClient: z.string().min(1, "Le nom est obligatoire"),
    emailClient: z
      .string()
      .email("Email invalide")
      .optional()
      .or(z.literal("").transform(() => undefined)),
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
    createAccount: z.boolean().optional(),
    password: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.createAccount || (data.password && data.password.length >= 8 && data.emailClient),
    {
      message: "Pour créer un compte, fournissez un email et un mot de passe d'au moins 8 caractères.",
      path: ["password"],
    }
  );

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
      createAccount,
      password,
    } = parsedInput;

    // 1. Identify buyer and pre-check account creation if requested
    const session = await auth();
    const existingUserId: string | null = session?.user?.id ?? null;
    const willCreateAccount = !existingUserId && !!createAccount && !!emailClient && !!password;

    // Pre-hash and pre-check the email outside the transaction (these are not DB writes,
    // and the bcrypt hash is CPU-bound — keep it out of the tx for shorter lock time).
    let hashedPasswordForNewUser: string | null = null;
    if (willCreateAccount) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email: emailClient! },
      });
      if (existingByEmail) {
        throw new Error(
          "Un compte existe déjà avec cet email. Connectez-vous d'abord ou utilisez une autre adresse."
        );
      }
      hashedPasswordForNewUser = await bcrypt.hash(password!, 12);
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
        return { ...item, boutiqueId: product.boutiqueId };
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
    let buyerUserId: string | null = existingUserId;

    // 3. Persist orders + upsert Client per boutique (user creation is inside
    // the transaction so a failure cleans up the account too)
    await prisma.$transaction(async (tx) => {
      if (willCreateAccount && hashedPasswordForNewUser) {
        const newUser = await tx.user.create({
          data: {
            name: nomClient,
            email: emailClient!,
            password: hashedPasswordForNewUser,
            role: "CLIENT",
            emailVerified: new Date(),
          } as any,
        });
        buyerUserId = newUser.id;
      }

      for (const [boutiqueId, boutiqueItems] of Object.entries(itemsByBoutique)) {
        // Find existing client deterministically: phone is the strongest identifier
        // (mobile-money flows). Fall back to email only when there is no phone match.
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
            userId: buyerUserId, // null for true guests, set for logged-in/just-registered buyers
            code: orderCode,
            total: orderTotal,
            notes: notes || null,
            modePaiement: paymentMethod,
            statutPaiement: "EN_ATTENTE",
            etat: "EN_ATTENTE",
          } as any,
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
          data: { paymentToken: transactionRef } as any,
        });
        return {
          success: true,
          paymentUrl: `/checkout/mock/order?ref=${transactionRef}&amount=${totalAmount}&method=STRIPE&ids=${createdCommandeIds.join(",")}`,
          accountCreatedEmail: willCreateAccount ? emailClient : undefined,
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
        data: { paymentToken: stripeSession.id } as any,
      });

      return {
        success: true,
        paymentUrl: stripeSession.url || undefined,
        accountCreatedEmail: willCreateAccount ? emailClient : undefined,
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
            data: { paymentToken: cpResponse.data.payment_token } as any,
          });

          return {
            success: true,
            paymentUrl: cpResponse.data.payment_url,
            accountCreatedEmail: willCreateAccount ? emailClient : undefined,
          };
        }
      }

      await prisma.commandeClient.updateMany({
        where: { id: { in: createdCommandeIds } },
        data: { paymentToken: transactionRef } as any,
      });

      return {
        success: true,
        paymentUrl: `/checkout/mock/order?ref=${transactionRef}&amount=${totalAmount}&method=${paymentMethod}&ids=${createdCommandeIds.join(",")}`,
        accountCreatedEmail: willCreateAccount ? emailClient : undefined,
      };
    }

    if (paymentMethod === "PAYPAL") {
      const transactionRef = `CMD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      await prisma.commandeClient.updateMany({
        where: { id: { in: createdCommandeIds } },
        data: { paymentToken: transactionRef } as any,
      });

      return {
        success: true,
        paymentUrl: `/checkout/mock/order?ref=${transactionRef}&amount=${totalAmount}&method=PAYPAL&ids=${createdCommandeIds.join(",")}`,
        accountCreatedEmail: willCreateAccount ? emailClient : undefined,
      };
    }

    // Cash on Delivery
    return {
      success: true,
      paymentUrl: `/checkout/success?success=true&method=cod&ids=${createdCommandeIds.join(",")}`,
      accountCreatedEmail: willCreateAccount ? emailClient : undefined,
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
      } as any,
    });

    console.log(`Mock order payment confirmed for orders: ${ids} (ref: ${transactionRef})`);

    return {
      success: true,
    };
  });
