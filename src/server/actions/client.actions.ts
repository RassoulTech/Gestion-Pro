"use server";

import { z } from "zod";
import { vendeurActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const createClientSchema = z.object({
  boutiqueId: z.string().min(1),
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  adresse: z.string().optional(),
});

export const createClient = vendeurActionClient
  .schema(createClientSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { boutiqueId, nom, prenom, telephone, email, adresse } = parsedInput;
    const { vendeurId } = ctx;

    // Verify access
    const membership = await prisma.membreBoutique.findUnique({
      where: { boutiqueId_vendeurId: { boutiqueId, vendeurId } },
    });
    if (!membership) throw new Error("BOUTIQUE_ACCESS_DENIED");

    const client = await prisma.client.create({
      data: {
        boutiqueId,
        nom,
        prenom: prenom || null,
        telephone: telephone || null,
        email: email || null,
        adresse: adresse || null,
      },
    });

    revalidatePath(`/boutiques/${boutiqueId}/clients`);
    return client;
  });

const updateClientSchema = z.object({
  boutiqueId: z.string().min(1),
  clientId: z.string().min(1),
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  adresse: z.string().optional(),
});

export const updateClient = vendeurActionClient
  .schema(updateClientSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { boutiqueId, clientId, nom, prenom, telephone, email, adresse } = parsedInput;
    const { vendeurId } = ctx;

    const membership = await prisma.membreBoutique.findUnique({
      where: { boutiqueId_vendeurId: { boutiqueId, vendeurId } },
    });
    if (!membership) throw new Error("BOUTIQUE_ACCESS_DENIED");

    const client = await prisma.client.update({
      where: { id: clientId, boutiqueId },
      data: {
        nom,
        prenom: prenom || null,
        telephone: telephone || null,
        email: email || null,
        adresse: adresse || null,
      },
    });

    revalidatePath(`/boutiques/${boutiqueId}/clients`);
    return client;
  });

export const deleteClient = vendeurActionClient
  .schema(z.object({ clientId: z.string().min(1), boutiqueId: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    const { clientId, boutiqueId } = parsedInput;
    const { vendeurId } = ctx;

    const membership = await prisma.membreBoutique.findUnique({
      where: { boutiqueId_vendeurId: { boutiqueId, vendeurId } },
    });
    if (!membership) throw new Error("BOUTIQUE_ACCESS_DENIED");

    await prisma.client.delete({
      where: { id: clientId, boutiqueId },
    });

    revalidatePath(`/boutiques/${boutiqueId}/clients`);
    return { success: true };
  });
