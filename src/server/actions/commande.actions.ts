"use server";

import { z } from "zod";
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

    const result = await prisma.$transaction(async (tx) => {
      const code = generateCode("CMD");
      let total = 0;

      const commande = await tx.commandeClient.create({
        data: {
          boutiqueId,
          clientId: data.clientId || null,
          userId: ctx.user.id,
          code,
          total: 0,
          // @ts-ignore - Prisma IDE cache glitch
          remise: data.remise || 0,
          montantRecu: data.montantRecu,
          monnaieRendue: data.monnaieRendue,
          notes: data.notes,
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

    await logActivity({
      userId: ctx.user.id,
      action: "commande.create",
      subjectType: "CommandeClient",
      subjectId: result.id,
    });

    revalidatePath(`/boutiques/${boutiqueId}/commandes`);
    return result;
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

      const commande = await tx.commandeFournisseur.create({
        data: {
          boutiqueId,
          fournisseurId: data.fournisseurId,
          code,
          total: 0,
          notes: data.notes,
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
