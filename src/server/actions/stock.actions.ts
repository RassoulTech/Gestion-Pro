"use server";

import { z } from "zod";
import { vendeurActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requireBoutiqueAccess } from "@/lib/permissions";
import { ajusterStockSchema } from "@/schemas/stock.schema";

export const ajusterStockManuellement = vendeurActionClient
  .schema(
    z.object({
      boutiqueId: z.string().min(1),
      data: ajusterStockSchema,
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { boutiqueId, data } = parsedInput;
    const { vendeurId, user } = ctx;

    await requireBoutiqueAccess(boutiqueId, vendeurId);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify the product exists and get its current quantity
      const produit = await tx.produit.findUnique({
        where: { id: data.produitId, boutiqueId },
      });

      if (!produit) {
        throw new Error("Produit introuvable ou vous n'avez pas l'accès.");
      }

      if (data.type === "SORTIE" && produit.quantite < data.quantite) {
        throw new Error("Quantité insuffisante en stock pour effectuer cette sortie.");
      }

      // 2. Update product quantity
      const increment = data.type === "ENTREE" ? data.quantite : -data.quantite;
      const updatedProduit = await tx.produit.update({
        where: { id: produit.id },
        data: { quantite: { increment } },
      });

      // 3. Create stock movement
      const mouvement = await tx.mouvementStock.create({
        data: {
          boutiqueId,
          produitId: produit.id,
          type: data.type,
          quantite: data.quantite,
          sourceType: "AJUSTEMENT",
          sourceId: data.raison, // store the reason in sourceId
        },
      });

      return { produit: updatedProduit, mouvement };
    });

    // 4. Log the activity
    await logActivity({
      userId: user.id,
      action: data.type === "ENTREE" ? "STOCK_ENTREE_MANUELLE" : "STOCK_SORTIE_MANUELLE",
      subjectType: "Produit",
      subjectId: result.produit.id,
      changes: {
        quantiteAjouteeOuRetiree: data.quantite,
        type: data.type,
        nouvelleQuantite: result.produit.quantite,
        raison: data.raison,
      },
    });

    return result;
  });
