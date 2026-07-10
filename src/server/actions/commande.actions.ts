"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { vendeurActionClient } from "@/lib/safe-action";
import { requireBoutiqueAccess } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import { generateCode } from "@/lib/utils";
import { isPremiumFeatureAllowed } from "@/lib/quotas";
import {
  createCommandeClientSchema,
  createCommandeFournisseurSchema,
  createVenteFlashSchema,
  updateEtatCommandeSchema,
} from "@/schemas/commande.schema";
import { revalidatePath } from "next/cache";

export const createCommandeClient = vendeurActionClient
  .schema(z.object({ boutiqueId: z.string(), data: createCommandeClientSchema }))
  .action(async ({ parsedInput: { boutiqueId, data }, ctx }) => {
    await requireBoutiqueAccess(boutiqueId, ctx.vendeurId);

    // Code fourni par le client (ventes hors-ligne) = clé d'idempotence ; sinon
    // généré côté serveur. Si une vente déjà synchronisée est rejouée, la
    // contrainte @@unique([boutiqueId, code]) lève P2002 → on renvoie la commande
    // existante au lieu d'en créer un doublon.
    const code = data.clientCode || generateCode("CMD");

    let result;
    try {
      result = await createCommandeTransaction({ boutiqueId, data, code, userId: ctx.user.id });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        data.clientCode
      ) {
        const existing = await prisma.commandeClient.findFirst({
          where: { boutiqueId, code },
        });
        if (existing) {
          revalidatePath(`/boutiques/${boutiqueId}/commandes`);
          return existing;
        }
      }
      throw e;
    }

    await logActivity({
      userId: ctx.user.id,
      action: "commande.create",
      subjectType: "CommandeClient",
      subjectId: result.id,
    });

    revalidatePath(`/boutiques/${boutiqueId}/commandes`);
    return result;
  });

async function createCommandeTransaction({
  boutiqueId,
  data,
  code,
  userId,
}: {
  boutiqueId: string;
  data: import("@/schemas/commande.schema").CreateCommandeClientInput;
  code: string;
  userId: string;
}) {
  return prisma.$transaction(async (tx) => {
      let total = 0;

      const commande = await tx.commandeClient.create({
        data: {
          boutiqueId,
          clientId: data.clientId || null,
          userId,
          code,
          total: 0,
          remise: data.remise || 0,
          montantRecu: data.montantRecu,
          monnaieRendue: data.monnaieRendue,
          notes: data.notes,
          date: data.date ? new Date(data.date) : undefined,
          etat: data.etat || undefined,
          modePaiement: data.modePaiement || undefined,
        },
      });

      for (const ligne of data.lignes) {
        const produit = await tx.produit.findFirst({
          where: { id: ligne.produitId, boutiqueId },
        });
        if (!produit) throw new Error(`Produit ${ligne.produitId} introuvable`);
        if (produit.quantite < ligne.quantite) {
          throw new Error(`Stock insuffisant pour ${produit.nom}`);
        }

        const sousTotal = ligne.quantite * ligne.prixUnitaire;
        total += sousTotal;

        await tx.ligneCommandeClient.create({
          data: {
            commandeId: commande.id,
            produitId: ligne.produitId,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
          },
        });

        await tx.produit.update({
          where: { id: ligne.produitId },
          data: { quantite: { decrement: ligne.quantite } },
        });

        await tx.mouvementStock.create({
          data: {
            boutiqueId,
            produitId: ligne.produitId,
            type: "SORTIE",
            quantite: ligne.quantite,
            sourceType: "CommandeClient",
            sourceId: commande.id,
          },
        });
      }

      const finalTotal = Math.max(0, total - (data.remise || 0));

      return tx.commandeClient.update({
        where: { id: commande.id },
        data: { total: finalTotal },
      });
  });
}

/**
 * Envoi (ou RENVOI) manuel de la facture d'une commande par E-MAIL au client.
 * Le PDF et les montants sont reconstruits CÔTÉ SERVEUR depuis la base — rien
 * ne vient de l'interface. Erreur claire si le client n'a pas d'e-mail.
 */
export const sendCommandeInvoiceByEmail = vendeurActionClient
  .schema(z.object({ boutiqueId: z.string().min(1), commandeId: z.string().min(1) }))
  .action(async ({ parsedInput: { boutiqueId, commandeId }, ctx }) => {
    await requireBoutiqueAccess(boutiqueId, ctx.vendeurId);

    // Capacité par plan (contrôle SERVEUR — l'UI ne fait que refléter).
    {
      const { getVendeurQuotas } = await import("@/lib/quotas");
      const { canUseFacturation, FACTURATION_LOCKED_MESSAGE } = await import("@/lib/plan-capabilities");
      if (!canUseFacturation(await getVendeurQuotas(ctx.vendeurId))) {
        throw new Error(FACTURATION_LOCKED_MESSAGE);
      }
    }

    const order = await prisma.commandeClient.findFirst({
      where: { id: commandeId, boutiqueId },
      include: {
        client: true,
        boutique: true,
        lignes: { include: { produit: true } },
      },
    });
    if (!order) throw new Error("Commande introuvable.");
    if (!order.client?.email?.trim()) {
      throw new Error(
        "Ce client n'a pas d'adresse e-mail. Ajoutez-la sur sa fiche client, puis réessayez."
      );
    }

    const { generateInvoicePDF } = await import("@/lib/generate-invoice");
    const { paymentMethodLabel } = await import("@/lib/payment-method");
    const { sendInvoiceEmailToClient } = await import("@/lib/mail");

    const dateSuffix = order.date.toISOString().slice(0, 10).replace(/-/g, "");
    const invoiceNumber =
      order.invoiceNumber || `FAC-${dateSuffix}-${order.code.replace(/^CMD-/, "")}`;
    const paid = order.statutPaiement === "CONFIRME";

    const doc = await generateInvoicePDF({
      invoiceNumber,
      date: order.date,
      status: paid ? "PAYEE" : "IMPAYEE",
      statusLabel: paid ? "Payée" : "À payer",
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
      lignes: order.lignes.map((l) => ({
        nom: l.produit.nom,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
      })),
      total: order.total,
      remise: order.remise,
      notes: order.notes,
      modePaiement: paymentMethodLabel(order.modePaiement),
      settings: order.boutique.factureSettings,
    });

    const result = await sendInvoiceEmailToClient({
      email: order.client.email,
      clientNom: [order.client.prenom, order.client.nom].filter(Boolean).join(" ").trim(),
      invoiceNumber,
      total: order.total,
      shopName: order.boutique.nom,
      pdfBuffer: Buffer.from(doc.output("arraybuffer")),
    });
    if (!result.sent) {
      throw new Error("L'envoi de l'e-mail a échoué. Veuillez réessayer dans un instant.");
    }

    // Persiste le numéro si c'était la première émission.
    if (!order.invoiceNumber) {
      await prisma.commandeClient.update({
        where: { id: order.id },
        data: { invoiceNumber },
      });
    }

    await logActivity({
      userId: ctx.user.id,
      action: "FACTURE_EMAIL_SENT",
      subjectType: "CommandeClient",
      subjectId: order.id,
      changes: { invoiceNumber, to: order.client.email },
    });

    return { success: true, email: order.client.email };
  });

export const updateEtatCommande = vendeurActionClient
  .schema(
    z.object({
      boutiqueId: z.string(),
      commandeId: z.string(),
      data: updateEtatCommandeSchema,
    })
  )
  .action(async ({ parsedInput: { boutiqueId, commandeId, data }, ctx }) => {
    await requireBoutiqueAccess(boutiqueId, ctx.vendeurId);

    // Load current state to know what stock adjustment to apply
    const current = await prisma.commandeClient.findFirst({
      where: { id: commandeId, boutiqueId },
      include: { lignes: true },
    });
    if (!current) {
      throw new Error("Commande introuvable.");
    }

    // Transitions are always allowed (vendor may correct a misclick). Stock is
    // reconciled on each transition crossing the ANNULEE boundary:
    //  - entering ANNULEE  → restock (was decremented at creation)
    //  - leaving ANNULEE   → re-decrement (commande becomes active again)
    const isCancelling =
      data.etat === "ANNULEE" && current.etat !== "ANNULEE";
    const isReactivating =
      current.etat === "ANNULEE" && data.etat !== "ANNULEE";

    const commande = await prisma.$transaction(async (tx) => {
      if (isCancelling) {
        for (const ligne of current.lignes) {
          await tx.produit.update({
            where: { id: ligne.produitId },
            data: { quantite: { increment: ligne.quantite } },
          });
          await tx.mouvementStock.create({
            data: {
              boutiqueId,
              produitId: ligne.produitId,
              type: "ENTREE",
              quantite: ligne.quantite,
              sourceType: "AnnulationCommande",
              sourceId: commandeId,
            },
          });
        }
      } else if (isReactivating) {
        // Vendor changed their mind after cancelling : re-take the stock that
        // was restored. If stock has been sold elsewhere in the meantime, the
        // produit row may go negative — we surface that to the vendor.
        for (const ligne of current.lignes) {
          const produit = await tx.produit.findUnique({
            where: { id: ligne.produitId },
            select: { nom: true, quantite: true },
          });
          if (produit && produit.quantite < ligne.quantite) {
            throw new Error(
              `Stock insuffisant pour réactiver cette commande : ${produit.nom} (disponible : ${produit.quantite}, requis : ${ligne.quantite}).`
            );
          }
          await tx.produit.update({
            where: { id: ligne.produitId },
            data: { quantite: { decrement: ligne.quantite } },
          });
          await tx.mouvementStock.create({
            data: {
              boutiqueId,
              produitId: ligne.produitId,
              type: "SORTIE",
              quantite: ligne.quantite,
              sourceType: "ReactivationCommande",
              sourceId: commandeId,
            },
          });
        }
      }

      return tx.commandeClient.update({
        where: { id: commandeId, boutiqueId },
        data: { etat: data.etat },
      });
    });

    await logActivity({
      userId: ctx.user.id,
      action: "commande.updateEtat",
      subjectType: "CommandeClient",
      subjectId: commandeId,
      changes: {
        from: current.etat,
        to: data.etat,
        restockedLignes: isCancelling ? current.lignes.length : 0,
        reSortieLignes: isReactivating ? current.lignes.length : 0,
      },
    });

    revalidatePath(`/boutiques/${boutiqueId}/commandes`);
    revalidatePath(`/boutiques/${boutiqueId}/commandes/${commandeId}`);
    revalidatePath(`/boutiques/${boutiqueId}/produits`);
    revalidatePath(`/boutiques/${boutiqueId}/stock`);
    return commande;
  });

export const createVenteFlash = vendeurActionClient
  .schema(z.object({ boutiqueId: z.string(), data: createVenteFlashSchema }))
  .action(async ({ parsedInput: { boutiqueId, data }, ctx }) => {
    await requireBoutiqueAccess(boutiqueId, ctx.vendeurId);

    // Secure Premium feature access
    const isAllowed = await isPremiumFeatureAllowed(ctx.vendeurId, "VENTES_FLASH");
    if (!isAllowed) {
      throw new Error("Cette fonctionnalité est exclusive aux abonnés Pro et Enterprise. Veuillez mettre à niveau votre forfait.");
    }

    const result = await prisma.$transaction(async (tx) => {
      const code = generateCode("VF");
      let total = 0;

      const vente = await tx.venteFlash.create({
        data: { boutiqueId, code, nomClient: data.nomClient, total: 0 },
      });

      for (const ligne of data.lignes) {
        const produit = await tx.produit.findFirst({
          where: { id: ligne.produitId, boutiqueId },
        });
        if (!produit) throw new Error(`Produit ${ligne.produitId} introuvable`);
        if (produit.quantite < ligne.quantite) {
          throw new Error(`Stock insuffisant pour ${produit.nom}`);
        }

        total += ligne.quantite * ligne.prixUnitaire;

        await tx.ligneVenteFlash.create({
          data: {
            venteFlashId: vente.id,
            produitId: ligne.produitId,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
          },
        });

        await tx.produit.update({
          where: { id: ligne.produitId },
          data: { quantite: { decrement: ligne.quantite } },
        });

        await tx.mouvementStock.create({
          data: {
            boutiqueId,
            produitId: ligne.produitId,
            type: "SORTIE",
            quantite: ligne.quantite,
            sourceType: "VenteFlash",
            sourceId: vente.id,
          },
        });
      }

      return tx.venteFlash.update({
        where: { id: vente.id },
        data: { total },
      });
    });

    await logActivity({
      userId: ctx.user.id,
      action: "venteFlash.create",
      subjectType: "VenteFlash",
      subjectId: result.id,
    });

    revalidatePath(`/boutiques/${boutiqueId}/ventes-flash`);
    return result;
  });

export const createCommandeFournisseur = vendeurActionClient
  .schema(
    z.object({ boutiqueId: z.string(), data: createCommandeFournisseurSchema })
  )
  .action(async ({ parsedInput: { boutiqueId, data }, ctx }) => {
    await requireBoutiqueAccess(boutiqueId, ctx.vendeurId);

    const result = await prisma.$transaction(async (tx) => {
      const code = generateCode("ACH");
      let total = 0;

      const effectiveEtat = data.etat || "LIVREE";
      const commande = await tx.commandeFournisseur.create({
        data: {
          boutiqueId,
          fournisseurId: data.fournisseurId,
          code,
          total: 0,
          notes: data.notes,
          date: data.date ? new Date(data.date) : undefined,
          etat: effectiveEtat,
        },
      });

      for (const ligne of data.lignes) {
        total += ligne.quantite * ligne.prixUnitaire;
        await tx.ligneCommandeFournisseur.create({
          data: {
            commandeId: commande.id,
            produitId: ligne.produitId,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
          },
        });

        // Increment stock and record movement if delivered/validated
        if (effectiveEtat === "LIVREE" || effectiveEtat === "VALIDEE") {
          await tx.produit.update({
            where: { id: ligne.produitId },
            data: { quantite: { increment: ligne.quantite } },
          });

          await tx.mouvementStock.create({
            data: {
              boutiqueId,
              produitId: ligne.produitId,
              type: "ENTREE",
              quantite: ligne.quantite,
              sourceType: "CommandeFournisseur",
              sourceId: commande.id,
            },
          });
        }
      }

      return tx.commandeFournisseur.update({
        where: { id: commande.id },
        data: { total },
      });
    });

    await logActivity({
      userId: ctx.user.id,
      action: "commandeFournisseur.create",
      subjectType: "CommandeFournisseur",
      subjectId: result.id,
    });

    revalidatePath(`/boutiques/${boutiqueId}/commandes-fournisseur`);
    return result;
  });
