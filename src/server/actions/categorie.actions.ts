"use server";

import { z } from "zod";
import { vendeurActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { requireBoutiqueAccess } from "@/lib/permissions";
import {
  createCategorieSchema,
  updateCategorieSchema,
} from "@/schemas/categorie.schema";

export const createCategorie = vendeurActionClient
  .schema(
    z.object({
      boutiqueId: z.string().min(1),
      data: createCategorieSchema,
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { boutiqueId, data } = parsedInput;
    const { vendeurId } = ctx;

    await requireBoutiqueAccess(boutiqueId, vendeurId);

    const categorie = await prisma.categorie.create({
      data: {
        boutiqueId,
        nom: data.nom,
        couleur: data.couleur,
      },
    });

    return { categorie };
  });

export const updateCategorie = vendeurActionClient
  .schema(
    z.object({
      boutiqueId: z.string().min(1),
      categorieId: z.string().min(1),
      data: updateCategorieSchema,
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { boutiqueId, categorieId, data } = parsedInput;
    const { vendeurId } = ctx;

    await requireBoutiqueAccess(boutiqueId, vendeurId);

    // IDOR-safe: scoped by id and boutiqueId
    const categorie = await prisma.categorie.update({
      where: { id: categorieId, boutiqueId },
      data: {
        nom: data.nom,
        couleur: data.couleur,
      },
    });

    return { categorie };
  });

export const deleteCategorie = vendeurActionClient
  .schema(
    z.object({
      boutiqueId: z.string().min(1),
      categorieId: z.string().min(1),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { boutiqueId, categorieId } = parsedInput;
    const { vendeurId } = ctx;

    await requireBoutiqueAccess(boutiqueId, vendeurId);

    // IDOR-safe: scoped by id and boutiqueId
    await prisma.categorie.delete({
      where: { id: categorieId, boutiqueId },
    });

    return { success: true };
  });
