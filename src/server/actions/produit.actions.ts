"use server";

import { z } from "zod";
import { vendeurActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requireBoutiqueAccess } from "@/lib/permissions";
import { checkProduitCreationLimit, clearQuotaCache } from "@/lib/quotas";
import {
  createProduitSchema,
  updateProduitSchema,
} from "@/schemas/produit.schema";

export const createProduit = vendeurActionClient
  .schema(
    z.object({
      boutiqueId: z.string().min(1),
      data: createProduitSchema,
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { boutiqueId, data } = parsedInput;
    const { vendeurId, user } = ctx;

    await requireBoutiqueAccess(boutiqueId, vendeurId);

    // Centralized quota verification
    const { allowed, count, max } = await checkProduitCreationLimit(boutiqueId, vendeurId);
    if (!allowed) {
      throw new Error(`Votre plan actuel est limité à ${max} produits pour cette boutique. Vous en possédez actuellement ${count}. Veuillez mettre à niveau votre forfait.`);
    }

    const produit = await prisma.$transaction(async (tx) => {
      const p = await tx.produit.create({
        data: {
          boutiqueId,
          nom: data.nom,
          code: data.code,
          description: data.description,
          categorieId: data.categorieId,
          prixAchat: data.prixAchat,
          prixUnitaire: data.prixUnitaire,
          quantite: data.quantite,
          seuilAlerte: data.seuilAlerte,
          photo: data.photo,
        },
      });

      // Record initial stock as an ENTREE movement
      if (data.quantite > 0) {
        await tx.mouvementStock.create({
          data: {
            boutiqueId,
            produitId: p.id,
            type: "ENTREE",
            quantite: data.quantite,
            sourceType: "CREATION",
            sourceId: p.id,
          },
        });
      }

      return p;
    });

    await logActivity({
      userId: user.id,
      action: "PRODUIT_CREATED",
      subjectType: "Produit",
      subjectId: produit.id,
      changes: { nom: produit.nom, boutiqueId },
    });

    // Invalidate the memory cache for quotas
    clearQuotaCache(vendeurId);

    return { produit };
  });

export const updateProduit = vendeurActionClient
  .schema(
    z.object({
      boutiqueId: z.string().min(1),
      produitId: z.string().min(1),
      data: updateProduitSchema,
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { boutiqueId, produitId, data } = parsedInput;
    const { vendeurId, user } = ctx;

    await requireBoutiqueAccess(boutiqueId, vendeurId);

    // IDOR-safe: where clause includes both id and boutiqueId
    const produit = await prisma.produit.update({
      where: { id: produitId, boutiqueId },
      data: {
        nom: data.nom,
        code: data.code,
        description: data.description,
        categorieId: data.categorieId,
        prixAchat: data.prixAchat,
        prixUnitaire: data.prixUnitaire,
        quantite: data.quantite,
        seuilAlerte: data.seuilAlerte,
        photo: data.photo,
      },
    });

    await logActivity({
      userId: user.id,
      action: "PRODUIT_UPDATED",
      subjectType: "Produit",
      subjectId: produitId,
      changes: { ...data, boutiqueId } as Record<string, unknown>,
    });

    return { produit };
  });

export const deleteProduit = vendeurActionClient
  .schema(
    z.object({
      boutiqueId: z.string().min(1),
      produitId: z.string().min(1),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { boutiqueId, produitId } = parsedInput;
    const { vendeurId, user } = ctx;

    await requireBoutiqueAccess(boutiqueId, vendeurId);

    // Delete in transaction: remove related records first, then the product
    await prisma.$transaction(async (tx) => {
      // Delete related stock movements
      await tx.mouvementStock.deleteMany({
        where: { produitId, boutiqueId },
      });

      // Delete related order lines
      await tx.ligneCommandeClient.deleteMany({
        where: { produitId },
      });

      // Delete related supplier order lines
      await tx.ligneCommandeFournisseur.deleteMany({
        where: { produitId },
      });

      // Delete related flash sale lines
      await tx.ligneVenteFlash.deleteMany({
        where: { produitId },
      });

      // IDOR-safe: delete scoped by both id and boutiqueId
      await tx.produit.delete({
        where: { id: produitId, boutiqueId },
      });
    });

    await logActivity({
      userId: user.id,
      action: "PRODUIT_DELETED",
      subjectType: "Produit",
      subjectId: produitId,
      changes: { boutiqueId },
    });

    return { success: true };
  });

export const checkProductLimitAction = vendeurActionClient
  .schema(z.object({ boutiqueId: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    const { boutiqueId } = parsedInput;
    const { vendeurId } = ctx;

    const currentAbonnement = await prisma.abonnement.findFirst({
      where: { vendeurId, statut: { in: ["ESSAI", "ACTIF"] } },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    const maxProduits = currentAbonnement?.plan.maxProduits ?? 50;

    const productCount = await prisma.produit.count({
      where: { boutiqueId },
    });

    return {
      limitReached: productCount >= maxProduits,
      productCount,
      maxProduits,
      planName: currentAbonnement?.plan.nom || "gratuit",
    };
  });

