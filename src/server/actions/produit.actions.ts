"use server";

import { z } from "zod";
import { vendeurActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requireBoutiqueAccess } from "@/lib/permissions";
import { checkProduitCreationLimit, clearQuotaCache, getVendeurQuotas } from "@/lib/quotas";
import { getLimitReachedMessage, PLAN_DEFINITIONS } from "@/lib/plan-limits";
import {
  createProduitSchema,
  updateProduitSchema,
} from "@/schemas/produit.schema";
import { getCurrentUser } from "@/lib/auth";

export async function importProductsExcel(boutiqueId: string, products: any[]) {
  const user = await getCurrentUser();
  if (!user || (!user.isImpersonating && user.role !== "ADMIN")) {
    return { success: false, error: "Non autorisé" };
  }

  try {
    // Vérifier l'accès à la boutique
    if (user.vendeurId) {
      await requireBoutiqueAccess(boutiqueId, user.vendeurId);
    } else if (user.role !== "ADMIN") {
      return { success: false, error: "Non autorisé" };
    }

    // Validation basique (sans Zod complet pour aller plus vite sur des gros fichiers)
    const validProducts = products.map((p) => ({
      boutiqueId,
      nom: String(p.nom).substring(0, 100),
      code: p.code ? String(p.code) : "",
      description: p.description ? String(p.description) : "",
      prixUnitaire: Number(p.prixUnitaire) || 0,
      prixAchat: p.prixAchat ? Number(p.prixAchat) : 0,
      quantite: Number(p.quantite) || 0,
      seuilAlerte: Number(p.seuilAlerte) || 5,
    }));

    // On peut utiliser transaction pour créer aussi les mouvements de stock initiaux
    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.produit.createMany({
        data: validProducts,
      });
      return created;
    });

    clearQuotaCache(user.vendeurId || "admin");

    return { success: true, count: result.count };
  } catch (error: any) {
    console.error("Import error:", error);
    return { success: false, error: error.message };
  }
}

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
    const { allowed } = await checkProduitCreationLimit(boutiqueId, vendeurId);
    if (!allowed) {
      const quotas = await getVendeurQuotas(vendeurId);
      throw new Error(getLimitReachedMessage(quotas.codePlan as "STARTER" | "PRO" | "ENTERPRISE"));
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

    const maxProduits = currentAbonnement?.plan.maxProduits ?? PLAN_DEFINITIONS.STARTER.maxProduits;

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

