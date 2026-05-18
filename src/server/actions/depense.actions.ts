"use server";

import { z } from "zod";
import { vendeurActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const createDepenseSchema = z.object({
  boutiqueId: z.string().min(1),
  libelle: z.string().min(1, "Le libellé est requis"),
  montant: z.number().min(0, "Le montant doit être positif"),
  categorie: z.string().optional(),
  date: z.coerce.date().optional(),
});

export const createDepense = vendeurActionClient
  .schema(createDepenseSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { boutiqueId, libelle, montant, categorie, date } = parsedInput;
    const { vendeurId } = ctx;

    const membership = await prisma.membreBoutique.findUnique({
      where: { boutiqueId_vendeurId: { boutiqueId, vendeurId } },
    });
    if (!membership) throw new Error("BOUTIQUE_ACCESS_DENIED");

    const depense = await prisma.depense.create({
      data: {
        boutiqueId,
        libelle,
        montant,
        categorie: categorie || "AUTRE",
        date: date || new Date(),
      },
    });

    revalidatePath(`/boutiques/${boutiqueId}/depenses`);
    revalidatePath(`/boutiques/${boutiqueId}`); // Update dashboard
    return depense;
  });

const updateDepenseSchema = z.object({
  boutiqueId: z.string().min(1),
  depenseId: z.string().min(1),
  libelle: z.string().min(1, "Le libellé est requis"),
  montant: z.number().min(0, "Le montant doit être positif"),
  categorie: z.string().optional(),
  date: z.coerce.date().optional(),
});

export const updateDepense = vendeurActionClient
  .schema(updateDepenseSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { boutiqueId, depenseId, libelle, montant, categorie, date } = parsedInput;
    const { vendeurId } = ctx;

    const membership = await prisma.membreBoutique.findUnique({
      where: { boutiqueId_vendeurId: { boutiqueId, vendeurId } },
    });
    if (!membership) throw new Error("BOUTIQUE_ACCESS_DENIED");

    const depense = await prisma.depense.update({
      where: { id: depenseId, boutiqueId },
      data: {
        libelle,
        montant,
        categorie: categorie || "AUTRE",
        date: date || undefined,
      },
    });

    revalidatePath(`/boutiques/${boutiqueId}/depenses`);
    revalidatePath(`/boutiques/${boutiqueId}`);
    return depense;
  });

export const deleteDepense = vendeurActionClient
  .schema(z.object({ depenseId: z.string().min(1), boutiqueId: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    const { depenseId, boutiqueId } = parsedInput;
    const { vendeurId } = ctx;

    const membership = await prisma.membreBoutique.findUnique({
      where: { boutiqueId_vendeurId: { boutiqueId, vendeurId } },
    });
    if (!membership) throw new Error("BOUTIQUE_ACCESS_DENIED");

    await prisma.depense.delete({
      where: { id: depenseId, boutiqueId },
    });

    revalidatePath(`/boutiques/${boutiqueId}/depenses`);
    revalidatePath(`/boutiques/${boutiqueId}`);
    return { success: true };
  });
