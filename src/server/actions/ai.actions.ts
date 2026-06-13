"use server";

import { z } from "zod";
import { vendeurActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { requireBoutiqueAccess } from "@/lib/permissions";
import { aiComplete, aiCompleteVision, getAiMode } from "@/lib/ai/provider";
import { assertAiQuota, incrementAiUsage, getAiQuotaState } from "@/lib/ai/quota";
import { getSectorLabel } from "@/lib/utils";
import {
  buildProductTask,
  buildImageProductsTask,
  buildDescriptionTask,
  buildInsightsTask,
  buildRelanceTask,
  suggestSku,
  PRODUCT_JSON_SCHEMA,
  PRODUCTS_JSON_SCHEMA,
  INSIGHTS_JSON_SCHEMA,
  type AiProductResult,
  type AiInsight,
  type ProductTaskContext,
} from "@/lib/ai/tasks";
import { getBoutiqueStats, getTopProduits } from "@/server/queries/dashboard.queries";

/** Contexte boutique (secteur, catégories, produits proches) pour ancrer la génération. */
async function loadProductContext(boutiqueId: string, input?: string): Promise<ProductTaskContext> {
  const motsRecherche = (input ?? "")
    .toLowerCase()
    .split(/[^a-z0-9àâçéèêëîïôûùüÿ]+/i)
    .filter((w) => w.length > 2)
    .slice(0, 4);

  const [boutique, categories, produitsSimilaires] = await Promise.all([
    prisma.boutique.findUnique({
      where: { id: boutiqueId },
      select: { secteurActivite: true },
    }),
    prisma.categorie.findMany({
      where: { boutiqueId },
      select: { nom: true },
      orderBy: { nom: "asc" },
      take: 30,
    }),
    motsRecherche.length
      ? prisma.produit.findMany({
          where: {
            boutiqueId,
            OR: motsRecherche.map((mot) => ({
              nom: { contains: mot, mode: "insensitive" as const },
            })),
          },
          select: { nom: true, prixUnitaire: true },
          take: 5,
        })
      : Promise.resolve([]),
  ]);

  return {
    secteur: boutique ? getSectorLabel(boutique.secteurActivite) : null,
    categories: categories.map((c) => c.nom),
    produitsSimilaires: produitsSimilaires.map((p) => ({ nom: p.nom, prix: p.prixUnitaire })),
  };
}

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

    const contexte = await loadProductContext(boutiqueId, input);
    const task = buildProductTask(input, contexte);
    const text = await aiComplete({
      system: task.system,
      user: task.user,
      mock: task.mock,
      maxTokens: 700,
      jsonSchema: PRODUCT_JSON_SCHEMA,
    });
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

    const contexte = await loadProductContext(boutiqueId);
    const task = buildImageProductsTask(contexte);
    const text = await aiCompleteVision({
      system: task.system,
      user: task.user,
      imageBase64,
      mimeType,
      mock: task.mock,
      maxTokens: 2000,
      jsonSchema: PRODUCTS_JSON_SCHEMA,
    });
    const parsed = extractJson<{ produits: Partial<AiProductResult>[] }>(text);
    const results = (parsed?.produits ?? [])
      .map((p) => normalizeProduct(p, ""))
      .filter((p) => p.nom.trim())
      .slice(0, 8);
    const confident = results.length > 0;

    // On ne décompte un crédit que si la reconnaissance a abouti.
    if (confident) {
      await prisma.aiGeneration.create({
        data: {
          userId: ctx.user.id,
          boutiqueId,
          type: "PRODUCT",
          prompt: "[image]",
          response: JSON.stringify(results),
        },
      });
      await incrementAiUsage(ctx.user.id, state.quota);
    }

    return { result: results[0] ?? null, results, confident };
  });

/** État du quota IA du vendeur (+ mode pour signaler l'aperçu simulé). */
export const getAiQuotaStateAction = vendeurActionClient.action(async ({ ctx }) => {
  const state = await getAiQuotaState(ctx.user.id, ctx.vendeurId);
  return { ...state, mode: getAiMode() };
});

// ─── Résumé intelligent du dashboard ─────────────────────────────────────────

export const generateDashboardInsightsAI = vendeurActionClient
  .schema(z.object({ boutiqueId: z.string().min(1) }))
  .action(async ({ parsedInput: { boutiqueId }, ctx }) => {
    await requireBoutiqueAccess(boutiqueId, ctx.vendeurId);
    const state = await assertAiQuota(ctx.user.id, ctx.vendeurId);

    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [stats, topProduits, stockBas, nbCommandes] = await Promise.all([
      getBoutiqueStats(boutiqueId, start, end),
      getTopProduits(boutiqueId, 5, start, end),
      prisma.$queryRaw<{ nom: string; quantite: number; seuil_alerte: number }[]>`
        SELECT nom, quantite, seuil_alerte FROM produits
        WHERE boutique_id = ${boutiqueId} AND quantite <= seuil_alerte
        ORDER BY quantite ASC LIMIT 5
      `,
      prisma.commandeClient.count({
        where: { boutiqueId, date: { gte: start, lte: end }, etat: { not: "ANNULEE" } },
      }),
    ]);

    const insightsStats = {
      periodeLabel: "les 30 derniers jours",
      caTotal: stats.ventesPeriod,
      nbCommandes,
      panierMoyen: nbCommandes > 0 ? stats.ventesPeriod / nbCommandes : 0,
      topProduits: topProduits.map((p) => ({ nom: p.nom, quantiteVendue: p.total })),
      stockBas: stockBas.map((s) => ({ nom: s.nom, quantite: s.quantite, seuil: s.seuil_alerte })),
      nbClients: stats.totalClients,
    };

    const task = buildInsightsTask(insightsStats);
    const text = await aiComplete({
      system: task.system,
      user: task.user,
      mock: task.mock,
      maxTokens: 800,
      jsonSchema: INSIGHTS_JSON_SCHEMA,
    });
    const parsed = extractJson<{ insights: AiInsight[] }>(text) ?? extractJson<{ insights: AiInsight[] }>(task.mock());
    const insights = (parsed?.insights ?? []).slice(0, 4);

    await prisma.aiGeneration.create({
      data: {
        userId: ctx.user.id,
        boutiqueId,
        type: "ANALYSIS",
        prompt: JSON.stringify(insightsStats).slice(0, 2000),
        response: JSON.stringify(insights),
      },
    });
    await incrementAiUsage(ctx.user.id, state.quota);

    return { insights };
  });

// ─── Relance client WhatsApp ─────────────────────────────────────────────────

export const generateClientRelanceAI = vendeurActionClient
  .schema(z.object({ boutiqueId: z.string().min(1), clientId: z.string().min(1) }))
  .action(async ({ parsedInput: { boutiqueId, clientId }, ctx }) => {
    await requireBoutiqueAccess(boutiqueId, ctx.vendeurId);
    const state = await assertAiQuota(ctx.user.id, ctx.vendeurId);

    const client = await prisma.client.findFirst({
      where: { id: clientId, boutiqueId },
      include: {
        boutique: { select: { nom: true } },
        commandes: {
          where: { etat: { not: "ANNULEE" } },
          orderBy: { date: "desc" },
          take: 5,
          include: {
            lignes: { include: { produit: { select: { nom: true } } }, take: 3 },
          },
        },
      },
    });
    if (!client) throw new Error("Client introuvable.");

    const derniere = client.commandes[0];
    const joursDepuisDernierAchat = derniere
      ? Math.floor((Date.now() - new Date(derniere.date).getTime()) / (24 * 60 * 60 * 1000))
      : null;
    const produitsAchetes = Array.from(
      new Set(client.commandes.flatMap((c) => c.lignes.map((l) => l.produit.nom)))
    ).slice(0, 3);

    const task = buildRelanceTask({
      boutiqueNom: client.boutique.nom,
      clientPrenom: client.prenom,
      clientNom: client.nom,
      joursDepuisDernierAchat,
      produitsAchetes,
      nbCommandes: client.commandes.length,
    });
    const message = (
      await aiComplete({ system: task.system, user: task.user, mock: task.mock, maxTokens: 300 })
    ).trim();

    await prisma.aiGeneration.create({
      data: {
        userId: ctx.user.id,
        boutiqueId,
        type: "MARKETING",
        prompt: `[relance] ${client.prenom ?? ""} ${client.nom}`.trim(),
        response: message,
      },
    });
    await incrementAiUsage(ctx.user.id, state.quota);

    return { message };
  });
