"use server";

import { z } from "zod";
import { adminActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const toggleVendeurSchema = z.object({
  vendeurId: z.string(),
});

export const toggleVendeurStatut = adminActionClient
  .schema(toggleVendeurSchema)
  .action(async ({ parsedInput }) => {
    const { vendeurId } = parsedInput;

    const vendeur = await prisma.vendeur.findUnique({
      where: { id: vendeurId },
      select: { statut: true },
    });

    if (!vendeur) {
      throw new Error("Vendeur non trouvé.");
    }

    const newStatut = vendeur.statut === "ACTIF" ? "SUSPENDU" : "ACTIF";

    await prisma.vendeur.update({
      where: { id: vendeurId },
      data: { statut: newStatut },
    });

    revalidatePath("/admin/vendeurs");
    revalidatePath("/admin/dashboard");
    return { success: true, newStatut };
  });

const toggleBoutiqueSchema = z.object({
  boutiqueId: z.string(),
});

export const toggleBoutiqueStatut = adminActionClient
  .schema(toggleBoutiqueSchema)
  .action(async ({ parsedInput }) => {
    const { boutiqueId } = parsedInput;

    const boutique = await prisma.boutique.findUnique({
      where: { id: boutiqueId },
      select: { statut: true },
    });

    if (!boutique) {
      throw new Error("Boutique non trouvée.");
    }

    const newStatut = boutique.statut === "ACTIF" ? "SUSPENDU" : "ACTIF";

    await prisma.boutique.update({
      where: { id: boutiqueId },
      data: { statut: newStatut },
    });

    revalidatePath("/admin/boutiques");
    revalidatePath("/admin/dashboard");
    return { success: true, newStatut };
  });
