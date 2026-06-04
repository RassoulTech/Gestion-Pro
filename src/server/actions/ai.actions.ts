"use server";

import { z } from "zod";
import { vendeurActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { requireBoutiqueAccess } from "@/lib/permissions";
import { aiComplete, aiCompleteVision } from "@/lib/ai/provider";
import { assertAiQuota, incrementAiUsage, getAiQuotaState } from "@/lib/ai/quota";
import { buildProductTask, buildImageProductTask, buildDescriptionTask, suggestSku, type AiProductResult } from "@/lib/ai/tasks";

/** Extrait et parse le premier objet JSON d'une réponse (tolère les ```json). */
function extractJson<T>(s: string): T | null {
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence?.[1] ?? s;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

function normalizeProduct(raw: Partial<AiProductResult> | null, fallbackNom: string): AiProductResult {
  const nom = raw?.nom?.toString().trim() || fallbackNom;
  return {
    nom,
    description: raw?.description?.toString().trim() || "",
    categorie: raw?.categorie?.toString().trim() || "Divers",
    sousCategorie: raw?.sousCategorie?.toString().trim() || "",
    unite: raw?.unite?.toString().trim() || "Pièce",
    tags: Array.isArray(raw?.tags) ? raw!.tags.map(String).slice(0, 8) : [],
    caracteristiques: Array.isArray(raw?.caracteristiques) ? raw!.caracteristiques.map(String).slice(0, 8) : [],
    sku: raw?.sku?.toString().trim() || (nom ? suggestSku(nom) : ""),
    prixConseille: typeof raw?.prixConseille === "number" ? raw!.prixConseille : null,
  };
}

export const generateProductAI = vendeurActionClient
  .schema(
    z.object({
      boutiqueId: z.string().min(1),
      input: z.string().min(2, "Saisissez au moins 2 caractères").max(200),
    })
  )
  .action(async ({ parsedInput: { boutiqueId, input }, ctx }) => {
    await requireBoutiqueAccess(boutiqueId, ctx.vendeurId);
    const state = await assertAiQuota(ctx.user.id, ctx.vendeurId);

    const task = buildProductTask(input);
    const text = await aiComplete({ system: task.system, user: task.user, mock: task.mock, maxTokens: 700 });
    const parsed = extractJson<AiProductResult>(text) ?? extractJson<AiProductResult>(task.mock());
    const result = normalizeProduct(parsed, input.trim());

    await prisma.aiGeneration.create({
      data: {
        userId: ctx.user.id,
        boutiqueId,
        type: "PRODUCT",
        prompt: input,
        response: JSON.stringify(result),
      },
    });
    await incrementAiUsage(ctx.user.id, state.quota);

    return { result };
  });

export const improveDescriptionAI = vendeurActionClient
  .schema(
    z.object({
      boutiqueId: z.string().min(1),
      nom: z.string().min(1).max(200),
      description: z.string().max(2000).optional().default(""),
      tone: z.enum(["pro", "commercial", "court", "detaille"]).default("pro"),
    })
  )
  .action(async ({ parsedInput: { boutiqueId, nom, description, tone }, ctx }) => {
    await requireBoutiqueAccess(boutiqueId, ctx.vendeurId);
    const state = await assertAiQuota(ctx.user.id, ctx.vendeurId);

    const task = buildDescriptionTask({ nom, description, tone });
    const text = await aiComplete({ system: task.system, user: task.user, mock: task.mock, maxTokens: 500 });
    const result = text.trim();

    await prisma.aiGeneration.create({
      data: {
        userId: ctx.user.id,
        boutiqueId,
        type: "DESCRIPTION",
        prompt: `[${tone}] ${nom}: ${description}`.slice(0, 1000),
        response: result,
      },
    });
    await incrementAiUsage(ctx.user.id, state.quota);

    return { result };
  });

export const generateProductFromImageAI = vendeurActionClient
  .schema(
    z.object({
      boutiqueId: z.string().min(1),
      imageBase64: z.string().min(10).max(9_000_000),
      mimeType: z.string().min(3).max(50),
    })
  )
  .action(async ({ parsedInput: { boutiqueId, imageBase64, mimeType }, ctx }) => {
    await requireBoutiqueAccess(boutiqueId, ctx.vendeurId);
    const state = await assertAiQuota(ctx.user.id, ctx.vendeurId);

    const task = buildImageProductTask();
    const text = await aiCompleteVision({
      system: task.system,
      user: task.user,
      imageBase64,
      mimeType,
      mock: task.mock,
    });
    const parsed = extractJson<AiProductResult>(text);
    const result = normalizeProduct(parsed, "");
    const confident = !!result.nom.trim();

    // On ne décompte un crédit que si la reconnaissance a abouti.
    if (confident) {
      await prisma.aiGeneration.create({
        data: {
          userId: ctx.user.id,
          boutiqueId,
          type: "PRODUCT",
          prompt: "[image]",
          response: JSON.stringify(result),
        },
      });
      await incrementAiUsage(ctx.user.id, state.quota);
    }

    return { result: confident ? result : null, confident };
  });

/** État du quota IA du vendeur (pour afficher le compteur dans le formulaire). */
export const getAiQuotaStateAction = vendeurActionClient.action(async ({ ctx }) => {
  return getAiQuotaState(ctx.user.id, ctx.vendeurId);
});
