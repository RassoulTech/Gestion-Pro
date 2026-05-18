"use server";

import { z } from "zod";
import { vendeurActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requireBoutiqueOwner } from "@/lib/permissions";
import { generateCode, slugify } from "@/lib/utils";
import { checkBoutiqueCreationLimit, checkMembreCreationLimit, clearQuotaCache } from "@/lib/quotas";
import {
  createBoutiqueSchema,
  updateBoutiqueSchema,
} from "@/schemas/boutique.schema";

export const createBoutique = vendeurActionClient
  .schema(createBoutiqueSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { vendeurId, user } = ctx;

    // Centralized quota verification
    const { allowed, count, max } = await checkBoutiqueCreationLimit(vendeurId);
    if (!allowed) {
      throw new Error(`Votre plan actuel est limité à ${max} boutique(s). Vous en possédez actuellement ${count}. Veuillez mettre à niveau votre forfait.`);
    }

    const baseSlug = slugify(parsedInput.nom);
    // Ensure slug uniqueness by appending a short random suffix if needed
    const existingSlug = await prisma.boutique.findUnique({
      where: { slug: baseSlug },
    });
    const slug = existingSlug
      ? `${baseSlug}-${generateCode("").split("-")[1]?.toLowerCase()}`
      : baseSlug;

    const boutique = await prisma.$transaction(async (tx) => {
      const b = await tx.boutique.create({
        data: {
          vendeurId,
          nom: parsedInput.nom,
          slug,
          description: parsedInput.description || null,
          adresse: parsedInput.adresse || null,
          siteWeb: parsedInput.siteWeb || null,
          email: parsedInput.email || null,
          telephone: parsedInput.telephone || null,
          secteurActivite: parsedInput.secteurActivite,
          logo: parsedInput.logo || null,
          latitude: parsedInput.latitude || null,
          longitude: parsedInput.longitude || null,
        },
      });

      // Create the OWNER membership automatically
      await tx.membreBoutique.create({
        data: {
          boutiqueId: b.id,
          vendeurId,
          role: "OWNER",
        },
      });

      return b;
    });

    await logActivity({
      userId: user.id,
      action: "BOUTIQUE_CREATED",
      subjectType: "Boutique",
      subjectId: boutique.id,
      changes: { nom: boutique.nom, slug: boutique.slug },
    });

    // Invalidate the memory cache for quotas
    clearQuotaCache(vendeurId);

    return { boutique };
  });

export const updateBoutique = vendeurActionClient
  .schema(
    z.object({
      boutiqueId: z.string().min(1),
      data: updateBoutiqueSchema,
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { boutiqueId, data } = parsedInput;
    const { vendeurId, user } = ctx;

    await requireBoutiqueOwner(boutiqueId, vendeurId);

    const boutique = await prisma.boutique.update({
      where: { id: boutiqueId },
      data: {
        nom: data.nom,
        description: data.description || null,
        adresse: data.adresse || null,
        siteWeb: data.siteWeb || null,
        email: data.email || null,
        telephone: data.telephone || null,
        secteurActivite: data.secteurActivite,
        logo: data.logo || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      },
    });

    await logActivity({
      userId: user.id,
      action: "BOUTIQUE_UPDATED",
      subjectType: "Boutique",
      subjectId: boutiqueId,
      changes: data as Record<string, unknown>,
    });

    return { boutique };
  });

export const deleteBoutique = vendeurActionClient
  .schema(z.object({ boutiqueId: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    const { boutiqueId } = parsedInput;
    const { vendeurId, user } = ctx;

    await requireBoutiqueOwner(boutiqueId, vendeurId);

    // Soft-delete: set statut to SUSPENDU
    await prisma.boutique.update({
      where: { id: boutiqueId },
      data: { statut: "SUSPENDU" },
    });

    await logActivity({
      userId: user.id,
      action: "BOUTIQUE_DELETED",
      subjectType: "Boutique",
      subjectId: boutiqueId,
    });

    return { success: true };
  });

export const checkBoutiqueLimitAction = vendeurActionClient
  .action(async ({ ctx }) => {
    const { vendeurId } = ctx;

    const currentAbonnement = await prisma.abonnement.findFirst({
      where: { vendeurId, statut: { in: ["ESSAI", "ACTIF"] } },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    const boutiqueCount = await prisma.boutique.count({
      where: { membres: { some: { vendeurId, role: "OWNER" } } },
    });

    const maxBoutiques = currentAbonnement?.plan.maxBoutiques ?? 1;

    return { limitReached: boutiqueCount >= maxBoutiques, boutiqueCount, maxBoutiques };
  });

export const inviteMembre = vendeurActionClient
  .schema(
    z.object({
      boutiqueId: z.string().min(1),
      email: z.string().email(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { boutiqueId, email } = parsedInput;
    const { vendeurId, user } = ctx;

    // Must be the owner to invite members
    await requireBoutiqueOwner(boutiqueId, vendeurId);

    // Enforce member limit quota
    const { allowed, count, max } = await checkMembreCreationLimit(boutiqueId, vendeurId);
    if (!allowed) {
      throw new Error(`Votre plan actuel est limité à ${max} membre(s) pour cette boutique. Vous avez déjà atteint cette limite.`);
    }

    // Find if user exists as Vendeur
    const targetUser = await prisma.user.findUnique({
      where: { email },
      include: { vendeur: true },
    });

    if (!targetUser || !targetUser.vendeur) {
      throw new Error("Aucun vendeur trouvé avec cette adresse email.");
    }

    const targetVendeurId = targetUser.vendeur.id;

    // Check if already a member
    const existingMember = await prisma.membreBoutique.findUnique({
      where: {
        boutiqueId_vendeurId: {
          boutiqueId,
          vendeurId: targetVendeurId,
        },
      },
    });

    if (existingMember) {
      throw new Error("Cet utilisateur est déjà membre de cette boutique.");
    }

    const member = await prisma.membreBoutique.create({
      data: {
        boutiqueId,
        vendeurId: targetVendeurId,
        role: "STAFF",
      },
    });

    await logActivity({
      userId: user.id,
      action: "MEMBRE_INVITED",
      subjectType: "MembreBoutique",
      subjectId: member.id,
      changes: { boutiqueId, email },
    });

    // Invalidate quota cache
    clearQuotaCache(vendeurId);

    return { success: true, member };
  });
