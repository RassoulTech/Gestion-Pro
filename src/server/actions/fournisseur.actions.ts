"use server";

import { z } from "zod";
import { vendeurActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const createFournisseurSchema = z.object({
  boutiqueId: z.string().min(1),
  nom: z.string().min(1, "Le nom est requis"),
  telephone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  adresse: z.string().optional(),
});

export const createFournisseur = vendeurActionClient
  .schema(createFournisseurSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { boutiqueId, nom, telephone, email, adresse } = parsedInput;
    const { vendeurId } = ctx;

    const membership = await prisma.membreBoutique.findUnique({
      where: { boutiqueId_vendeurId: { boutiqueId, vendeurId } },
    });
    if (!membership) throw new Error("BOUTIQUE_ACCESS_DENIED");

    const fournisseur = await prisma.fournisseur.create({
      data: {
        boutiqueId,
        nom,
        telephone: telephone || null,
        email: email || null,
        adresse: adresse || null,
      },
    });

    revalidatePath(`/boutiques/${boutiqueId}/fournisseurs`);
    return fournisseur;
  });

const updateFournisseurSchema = z.object({
  boutiqueId: z.string().min(1),
  fournisseurId: z.string().min(1),
  nom: z.string().min(1, "Le nom est requis"),
  telephone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  adresse: z.string().optional(),
});

export const updateFournisseur = vendeurActionClient
  .schema(updateFournisseurSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { boutiqueId, fournisseurId, nom, telephone, email, adresse } = parsedInput;
    const { vendeurId } = ctx;

    const membership = await prisma.membreBoutique.findUnique({
      where: { boutiqueId_vendeurId: { boutiqueId, vendeurId } },
    });
    if (!membership) throw new Error("BOUTIQUE_ACCESS_DENIED");

    const fournisseur = await prisma.fournisseur.update({
      where: { id: fournisseurId, boutiqueId },
      data: {
        nom,
        telephone: telephone || null,
        email: email || null,
        adresse: adresse || null,
      },
    });

    revalidatePath(`/boutiques/${boutiqueId}/fournisseurs`);
    return fournisseur;
  });

export const deleteFournisseur = vendeurActionClient
  .schema(z.object({ fournisseurId: z.string().min(1), boutiqueId: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    const { fournisseurId, boutiqueId } = parsedInput;
    const { vendeurId } = ctx;

    const membership = await prisma.membreBoutique.findUnique({
      where: { boutiqueId_vendeurId: { boutiqueId, vendeurId } },
    });
    if (!membership) throw new Error("BOUTIQUE_ACCESS_DENIED");

    await prisma.fournisseur.delete({
      where: { id: fournisseurId, boutiqueId },
    });

    revalidatePath(`/boutiques/${boutiqueId}/fournisseurs`);
    return { success: true };
  });
