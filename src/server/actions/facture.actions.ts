"use server";

import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { vendeurActionClient } from "@/lib/safe-action";
import { requireBoutiqueAccess } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import { boutiqueHasFeature } from "@/lib/quotas";
import {
  createFactureSchema,
  updateFactureStatutSchema,
} from "@/schemas/facture.schema";

const FEATURE_DENIED =
  "Les factures manuelles sont réservées aux forfaits Pro et Enterprise. Mettez à niveau votre abonnement pour en profiter.";

/** Numéro séquentiel par boutique et par année : FAC-2026-0001. */
async function nextNumero(
  tx: Prisma.TransactionClient,
  boutiqueId: string
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FAC-${year}-`;
  const count = await tx.facture.count({
    where: { boutiqueId, numero: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

export const createFacture = vendeurActionClient
  .schema(z.object({ boutiqueId: z.string().min(1), data: createFactureSchema }))
  .action(async ({ parsedInput: { boutiqueId, data }, ctx }) => {
    await requireBoutiqueAccess(boutiqueId, ctx.vendeurId);

    if (!(await boutiqueHasFeature(boutiqueId, "FACTURES_MANUELLES"))) {
      throw new Error(FEATURE_DENIED);
    }

    const remise = data.remise ?? 0;
    const tauxTva = data.tauxTva ?? 0;
    const deduireStock = data.deduireStock ?? false;

    const result = await prisma.$transaction(async (tx) => {
      const numero = await nextNumero(tx, boutiqueId);

      // Snapshot client : priorité au client enregistré, sinon saisie libre.
      let clientId: string | null = data.clientId || null;
      let snapshot = {
        nom: data.clientNom?.trim() || null,
        telephone: data.clientTelephone?.trim() || null,
        email: data.clientEmail?.trim() || null,
        adresse: data.clientAdresse?.trim() || null,
      };
      if (clientId) {
        const client = await tx.client.findFirst({
          where: { id: clientId, boutiqueId },
        });
        if (!client) throw new Error("Client introuvable.");
        snapshot = {
          nom: [client.prenom, client.nom].filter(Boolean).join(" ").trim() || client.nom,
          telephone: client.telephone,
          email: client.email,
          adresse: client.adresse,
        };
      } else {
        clientId = null;
      }

      let sousTotal = 0;
      const facture = await tx.facture.create({
        data: {
          boutiqueId,
          clientId,
          numero,
          date: data.date ? new Date(data.date) : undefined,
          statut: data.statut ?? "BROUILLON",
          clientNom: snapshot.nom,
          clientTelephone: snapshot.telephone,
          clientEmail: snapshot.email,
          clientAdresse: snapshot.adresse,
          remise,
          tauxTva,
          notes: data.notes?.trim() || null,
          stockDeduit: deduireStock,
        },
      });

      for (const ligne of data.lignes) {
        sousTotal += ligne.quantite * ligne.prixUnitaire;

        await tx.ligneFacture.create({
          data: {
            factureId: facture.id,
            produitId: ligne.produitId || null,
            designation: ligne.designation,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
          },
        });

        // Déduction de stock optionnelle (uniquement lignes liées à un produit).
        if (deduireStock && ligne.produitId) {
          const produit = await tx.produit.findFirst({
            where: { id: ligne.produitId, boutiqueId },
          });
          if (!produit) throw new Error("Produit introuvable.");
          if (produit.quantite < ligne.quantite) {
            throw new Error(`Stock insuffisant pour ${produit.nom}.`);
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
              sourceType: "Facture",
              sourceId: facture.id,
            },
          });
        }
      }

      const base = Math.max(0, sousTotal - remise);
      const montantTva = Math.round((base * tauxTva) / 100);
      const total = base + montantTva;

      return tx.facture.update({
        where: { id: facture.id },
        data: { sousTotal, montantTva, total },
      });
    });

    await logActivity({
      userId: ctx.user.id,
      action: "facture.create",
      subjectType: "Facture",
      subjectId: result.id,
      changes: { numero: result.numero, total: result.total },
    });

    revalidatePath(`/boutiques/${boutiqueId}/factures`);
    revalidatePath(`/boutiques/${boutiqueId}/produits`);
    revalidatePath(`/boutiques/${boutiqueId}/stock`);
    return result;
  });

/**
 * Envoi (ou RENVOI) manuel d'une facture par E-MAIL au client. PDF et montants
 * reconstruits CÔTÉ SERVEUR depuis la base. Erreur claire si e-mail manquant.
 */
export const sendFactureByEmail = vendeurActionClient
  .schema(z.object({ boutiqueId: z.string().min(1), factureId: z.string().min(1) }))
  .action(async ({ parsedInput: { boutiqueId, factureId }, ctx }) => {
    await requireBoutiqueAccess(boutiqueId, ctx.vendeurId);

    const facture = await prisma.facture.findFirst({
      where: { id: factureId, boutiqueId },
      include: { lignes: true, boutique: true },
    });
    if (!facture) throw new Error("Facture introuvable.");
    if (!facture.clientEmail?.trim()) {
      throw new Error(
        "Aucune adresse e-mail sur cette facture. Renseignez l'e-mail du client, puis réessayez."
      );
    }

    const { generateInvoicePDF } = await import("@/lib/generate-invoice");
    const { sendInvoiceEmailToClient } = await import("@/lib/mail");
    const { FACTURE_STATUT_CONFIG } = await import("@/lib/facture-statut");

    const doc = await generateInvoicePDF({
      invoiceNumber: facture.numero,
      date: facture.date,
      status: facture.statut,
      statusLabel: FACTURE_STATUT_CONFIG[facture.statut]?.label ?? facture.statut,
      boutique: {
        nom: facture.boutique.nom,
        logo: facture.boutique.logo,
        telephone: facture.boutique.telephone,
        email: facture.boutique.email,
        adresse: facture.boutique.adresse,
      },
      client: {
        nom: facture.clientNom || "Client occasionnel",
        prenom: null,
        telephone: facture.clientTelephone,
        email: facture.clientEmail,
        adresse: facture.clientAdresse,
      },
      lignes: facture.lignes.map((l) => ({
        nom: l.designation,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
      })),
      total: facture.total,
      remise: facture.remise,
      montantTva: facture.montantTva,
      tauxTva: facture.tauxTva,
      notes: facture.notes,
      settings: facture.boutique.factureSettings,
    });

    const result = await sendInvoiceEmailToClient({
      email: facture.clientEmail,
      clientNom: facture.clientNom || "Cher client",
      invoiceNumber: facture.numero,
      total: facture.total,
      shopName: facture.boutique.nom,
      pdfBuffer: Buffer.from(doc.output("arraybuffer")),
    });
    if (!result.sent) {
      throw new Error("L'envoi de l'e-mail a échoué. Veuillez réessayer dans un instant.");
    }

    await logActivity({
      userId: ctx.user.id,
      action: "FACTURE_EMAIL_SENT",
      subjectType: "Facture",
      subjectId: facture.id,
      changes: { numero: facture.numero, to: facture.clientEmail },
    });

    return { success: true, email: facture.clientEmail };
  });

export const updateFactureStatut = vendeurActionClient
  .schema(
    z.object({
      boutiqueId: z.string().min(1),
      factureId: z.string().min(1),
      data: updateFactureStatutSchema,
    })
  )
  .action(async ({ parsedInput: { boutiqueId, factureId, data }, ctx }) => {
    await requireBoutiqueAccess(boutiqueId, ctx.vendeurId);

    const current = await prisma.facture.findFirst({
      where: { id: factureId, boutiqueId },
      include: { lignes: true },
    });
    if (!current) throw new Error("Facture introuvable.");

    const isCancelling = data.statut === "ANNULEE" && current.statut !== "ANNULEE";

    const facture = await prisma.$transaction(async (tx) => {
      // À l'annulation, on restitue le stock déduit (s'il l'était) pour éviter
      // toute fuite d'inventaire. La facture reste consultable.
      if (isCancelling && current.stockDeduit) {
        for (const ligne of current.lignes) {
          if (!ligne.produitId) continue;
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
              sourceType: "AnnulationFacture",
              sourceId: factureId,
            },
          });
        }
      }

      return tx.facture.update({
        where: { id: factureId },
        data: {
          statut: data.statut,
          stockDeduit:
            isCancelling && current.stockDeduit ? false : current.stockDeduit,
        },
      });
    });

    await logActivity({
      userId: ctx.user.id,
      action: "facture.updateStatut",
      subjectType: "Facture",
      subjectId: factureId,
      changes: { from: current.statut, to: data.statut },
    });

    revalidatePath(`/boutiques/${boutiqueId}/factures`);
    revalidatePath(`/boutiques/${boutiqueId}/factures/${factureId}`);
    revalidatePath(`/boutiques/${boutiqueId}/produits`);
    revalidatePath(`/boutiques/${boutiqueId}/stock`);
    return facture;
  });

export const deleteFacture = vendeurActionClient
  .schema(z.object({ boutiqueId: z.string().min(1), factureId: z.string().min(1) }))
  .action(async ({ parsedInput: { boutiqueId, factureId }, ctx }) => {
    await requireBoutiqueAccess(boutiqueId, ctx.vendeurId);

    const current = await prisma.facture.findFirst({
      where: { id: factureId, boutiqueId },
      include: { lignes: true },
    });
    if (!current) throw new Error("Facture introuvable.");

    await prisma.$transaction(async (tx) => {
      // Restitue le stock si la facture le déduisait encore.
      if (current.stockDeduit && current.statut !== "ANNULEE") {
        for (const ligne of current.lignes) {
          if (!ligne.produitId) continue;
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
              sourceType: "AnnulationFacture",
              sourceId: factureId,
            },
          });
        }
      }
      await tx.facture.delete({ where: { id: factureId } });
    });

    await logActivity({
      userId: ctx.user.id,
      action: "facture.delete",
      subjectType: "Facture",
      subjectId: factureId,
      changes: { numero: current.numero },
    });

    revalidatePath(`/boutiques/${boutiqueId}/factures`);
    revalidatePath(`/boutiques/${boutiqueId}/produits`);
    revalidatePath(`/boutiques/${boutiqueId}/stock`);
    return { success: true };
  });
