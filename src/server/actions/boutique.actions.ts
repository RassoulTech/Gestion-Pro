"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { env } from "@/env.mjs";
import { vendeurActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { deleteBoutiquesData, deleteUserCascade } from "@/server/services/account-deletion";
import { requireBoutiqueOwner } from "@/lib/permissions";
import { generateCode, slugify } from "@/lib/utils";
import { boutiqueHasFeature, checkBoutiqueCreationLimit, checkMembreCreationLimit, clearQuotaCache, getVendeurQuotas } from "@/lib/quotas";
import { getLimitReachedMessage } from "@/lib/plan-limits";
import {
  createBoutiqueSchema,
  updateBoutiqueSchema,
} from "@/schemas/boutique.schema";

export const createBoutique = vendeurActionClient
  .schema(createBoutiqueSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { vendeurId, user } = ctx;

    // Centralized quota verification
    const { allowed } = await checkBoutiqueCreationLimit(vendeurId);
    if (!allowed) {
      const quotas = await getVendeurQuotas(vendeurId);
      throw new Error(getLimitReachedMessage(quotas.codePlan as "STARTER" | "PRO" | "ENTERPRISE"));
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
        whatsapp: data.whatsapp || null,
        facebook: data.facebook || null,
        instagram: data.instagram || null,
        linkedin: data.linkedin || null,
        twitter: data.twitter || null,
        horaires: data.horaires || null,
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

/** Slugs réservés (routes de l'app) — interdits comme lien de boutique. */
const RESERVED_SLUGS = new Set([
  "admin", "api", "marketplace", "boutiques", "boutique", "login", "register",
  "pricing", "contact", "support", "blog", "s", "shop", "store", "checkout",
  "panier", "profil", "onboarding", "status", "flyer", "cgu", "cgv",
]);

export const updateBoutiqueSlug = vendeurActionClient
  .schema(z.object({ boutiqueId: z.string().min(1), slug: z.string().min(1) }))
  .action(async ({ parsedInput: { boutiqueId, slug: rawSlug }, ctx }) => {
    const { vendeurId, user } = ctx;
    await requireBoutiqueOwner(boutiqueId, vendeurId);

    if (!(await boutiqueHasFeature(boutiqueId, "LIEN_BOUTIQUE"))) {
      throw new Error(
        "Le lien personnalisé est réservé aux forfaits Pro et Enterprise."
      );
    }

    const slug = slugify(rawSlug);
    if (slug.length < 3 || slug.length > 40) {
      throw new Error(
        "Le lien doit contenir entre 3 et 40 caractères (lettres, chiffres et tirets)."
      );
    }
    if (RESERVED_SLUGS.has(slug)) {
      throw new Error("Ce lien est réservé. Choisissez-en un autre.");
    }

    const existing = await prisma.boutique.findUnique({ where: { slug } });
    if (existing && existing.id !== boutiqueId) {
      throw new Error("Ce lien est déjà utilisé par une autre boutique.");
    }

    const boutique = await prisma.boutique.update({
      where: { id: boutiqueId },
      data: { slug },
    });

    await logActivity({
      userId: user.id,
      action: "BOUTIQUE_SLUG_UPDATED",
      subjectType: "Boutique",
      subjectId: boutiqueId,
      changes: { slug },
    });

    revalidatePath(`/boutiques/${boutiqueId}/parametres`);
    return { slug: boutique.slug };
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

export const reactivateBoutique = vendeurActionClient
  .schema(z.object({ boutiqueId: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    const { boutiqueId } = parsedInput;
    const { vendeurId, user } = ctx;

    await requireBoutiqueOwner(boutiqueId, vendeurId);

    await prisma.boutique.update({
      where: { id: boutiqueId },
      data: { statut: "ACTIF" },
    });

    await logActivity({
      userId: user.id,
      action: "BOUTIQUE_REACTIVATED",
      subjectType: "Boutique",
      subjectId: boutiqueId,
    });

    return { success: true };
  });

export const deleteBoutiquePermanent = vendeurActionClient
  .schema(
    z.object({
      boutiqueId: z.string().min(1),
      password: z.string().min(1, "Le mot de passe est requis"),
      confirmation: z.string().min(1, "La confirmation est requise"),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { boutiqueId, password, confirmation } = parsedInput;
    const { vendeurId, user } = ctx;

    if (confirmation !== "SUPPRIMER MA BOUTIQUE") {
      throw new Error("La confirmation doit être exactement « SUPPRIMER MA BOUTIQUE »");
    }

    await requireBoutiqueOwner(boutiqueId, vendeurId);

    // Garde-fou facturation : on empêche la suppression de la DERNIÈRE boutique
    // tant qu'un abonnement payant actif n'est pas résilié (uniquement quand le
    // billing est activé — en mode sandbox cette règle est ignorée).
    const billingOn =
      process.env.BILLING_ENABLED === "true" || env.BILLING_ENABLED === "true";
    if (billingOn) {
      const [activeSub, ownedCount] = await Promise.all([
        prisma.abonnement.findFirst({
          where: { vendeurId, statut: "ACTIF" },
          include: { plan: true },
        }),
        prisma.boutique.count({
          where: { membres: { some: { vendeurId, role: "OWNER" } } },
        }),
      ]);
      if (activeSub && activeSub.plan.codePlan !== "STARTER" && ownedCount <= 1) {
        throw new Error(
          "Vous avez un abonnement actif. Résiliez-le depuis l'onglet Abonnement avant de supprimer votre dernière boutique."
        );
      }
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });
    if (!dbUser?.password) {
      throw new Error("Aucun mot de passe défini sur ce compte. Définissez-en un avant de supprimer une boutique.");
    }
    const ok = await bcrypt.compare(password, dbUser.password);
    if (!ok) {
      throw new Error("Mot de passe incorrect");
    }

    const boutique = await prisma.boutique.findUnique({
      where: { id: boutiqueId },
      select: { nom: true, slug: true },
    });

    // ⚠️ Pas de `boutique.delete` nu : les lignes de vente référencent Produit
    // en RESTRICT → la cascade DB échoue (P2003) dès qu'il y a un historique.
    // Cascade ordonnée partagée, atomique (tout ou rien).
    await prisma.$transaction(
      async (tx) => deleteBoutiquesData(tx, [boutiqueId]),
      { timeout: 30000 }
    );

    await logActivity({
      userId: user.id,
      action: "BOUTIQUE_PERMANENTLY_DELETED",
      subjectType: "Boutique",
      subjectId: boutiqueId,
      changes: { nom: boutique?.nom, slug: boutique?.slug },
    });

    clearQuotaCache(vendeurId);

    return { success: true };
  });

export const deleteVendorAccount = vendeurActionClient
  .schema(
    z.object({
      password: z.string().min(1, "Le mot de passe est requis"),
      confirmation: z.string().min(1, "La confirmation est requise"),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { password, confirmation } = parsedInput;
    const { user } = ctx;

    if (confirmation !== "SUPPRIMER") {
      throw new Error("La confirmation doit être exactement \"SUPPRIMER\"");
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true, email: true },
    });
    if (!dbUser?.password) {
      throw new Error("Aucun mot de passe défini sur ce compte. Définissez-en un avant de supprimer votre compte.");
    }
    const ok = await bcrypt.compare(password, dbUser.password);
    if (!ok) {
      throw new Error("Mot de passe incorrect");
    }

    // ⚠️ Pas de `user.delete` nu : la cascade User→Vendeur→Boutique→Produit est
    // bloquée par les FK RESTRICT des lignes de vente (P2003) dès que le vendeur
    // a un historique → le compte restait en base ("le compte existe déjà" à la
    // réinscription). Cascade ordonnée partagée, atomique.
    const boutiques = await prisma.boutique.findMany({
      where: { vendeurId: ctx.vendeurId },
      select: { id: true },
    });
    await prisma.$transaction(
      async (tx) =>
        deleteUserCascade(tx, {
          userId: user.id,
          email: dbUser.email,
          vendeurId: ctx.vendeurId,
          boutiqueIds: boutiques.map((b) => b.id),
        }),
      { timeout: 30000 }
    );

    // Journalisé APRÈS le succès (jamais avant : sinon audit menteur en cas
    // d'échec). userId omis : le User n'existe plus (FK) ; l'email suffit.
    await logActivity({
      action: "USER_ACCOUNT_DELETED",
      subjectType: "User",
      subjectId: user.id,
      changes: { email: dbUser.email },
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
    const { allowed, max } = await checkMembreCreationLimit(boutiqueId, vendeurId);
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
