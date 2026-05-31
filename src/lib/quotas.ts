import { prisma } from "@/lib/prisma";
import { env } from "@/env.mjs";

export interface PlanQuotas {
  codePlan: string;
  nom: string;
  maxBoutiques: number;
  maxProduits: number;
  maxMembres: number;
  features: string[];
  isActive: boolean;
  essaiFin: Date | null;
  dateFin: Date | null;
  statut: "EN_ATTENTE" | "ESSAI" | "ACTIF" | "EXPIRE" | "ANNULE";
}

// Simple memory cache for 5 minutes (300,000 ms)
type CacheEntry = {
  data: PlanQuotas;
  timestamp: number;
};
const quotaCache = new Map<string, CacheEntry>();

export function clearQuotaCache(vendeurId: string) {
  quotaCache.delete(vendeurId);
}

export async function getVendeurQuotas(vendeurId: string): Promise<PlanQuotas> {
  // 1. Check memory cache
  const cached = quotaCache.get(vendeurId);
  if (cached && Date.now() - cached.timestamp < 300000) {
    return cached.data;
  }

  // 2. Query active subscription in Database
  const activeSubscription = await prisma.abonnement.findFirst({
    where: {
      vendeurId,
      statut: { in: ["ESSAI", "ACTIF"] },
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  let result: PlanQuotas;

  if (!activeSubscription) {
    // If no active subscription found, fallback to Starter plan from database
    const starterPlan = await prisma.plan.findFirst({
      where: { codePlan: "STARTER" },
    });

    result = {
      codePlan: "STARTER",
      nom: starterPlan?.nom || "Starter",
      maxBoutiques: starterPlan?.maxBoutiques ?? 1,
      maxProduits: starterPlan?.maxProduits ?? 50,
      maxMembres: starterPlan?.maxMembres ?? 1,
      features: (starterPlan?.features as string[]) || ["1 boutique max", "50 produits max"],
      isActive: false, // No active paying subscription
      essaiFin: null,
      dateFin: null,
      statut: "EXPIRE",
    };
  } else {
    // Starter is free forever — never expire it, even if an old row still has
    // an essaiFin set from before the "free-for-life" change.
    const isStarter = activeSubscription.plan.codePlan === "STARTER";

    const isTrialExpired =
      !isStarter &&
      activeSubscription.statut === "ESSAI" &&
      activeSubscription.essaiFin &&
      new Date() > activeSubscription.essaiFin;

    const isPlanExpired =
      !isStarter &&
      activeSubscription.statut === "ACTIF" &&
      activeSubscription.dateFin &&
      new Date() > activeSubscription.dateFin;

    if (isTrialExpired || isPlanExpired) {
      // Mark as expired
      await prisma.abonnement.update({
        where: { id: activeSubscription.id },
        data: { statut: "EXPIRE" },
      });

      // Fallback to Starter plan
      const starterPlan = await prisma.plan.findFirst({
        where: { codePlan: "STARTER" },
      });

      result = {
        codePlan: "STARTER",
        nom: starterPlan?.nom || "Starter",
        maxBoutiques: starterPlan?.maxBoutiques ?? 1,
        maxProduits: starterPlan?.maxProduits ?? 50,
        maxMembres: starterPlan?.maxMembres ?? 1,
        features: (starterPlan?.features as string[]) || ["1 boutique max", "50 produits max"],
        isActive: false,
        essaiFin: null,
        dateFin: null,
        statut: "EXPIRE",
      };
    } else {
      result = {
        codePlan: activeSubscription.plan.codePlan || "STARTER",
        nom: activeSubscription.plan.nom,
        maxBoutiques: activeSubscription.plan.maxBoutiques,
        maxProduits: activeSubscription.plan.maxProduits,
        maxMembres: activeSubscription.plan.maxMembres,
        features: (activeSubscription.plan.features as string[]) || [],
        isActive: true,
        essaiFin: activeSubscription.essaiFin,
        dateFin: activeSubscription.dateFin,
        statut: activeSubscription.statut,
      };
    }
  }

  // Cache the result
  quotaCache.set(vendeurId, { data: result, timestamp: Date.now() });
  return result;
}

// Quota validation checks
export async function checkBoutiqueCreationLimit(
  vendeurId: string
): Promise<{ allowed: boolean; count: number; max: number }> {
  if (process.env.BILLING_ENABLED !== "true" && env.BILLING_ENABLED !== "true") {
    return { allowed: true, count: 0, max: 999999 };
  }
  const quotas = await getVendeurQuotas(vendeurId);

  // Count only boutiques where this vendeur is the OWNER
  const count = await prisma.boutique.count({
    where: {
      membres: {
        some: { vendeurId, role: "OWNER" },
      },
      statut: "ACTIF",
    },
  });

  return {
    allowed: count < quotas.maxBoutiques,
    count,
    max: quotas.maxBoutiques,
  };
}

export async function checkProduitCreationLimit(
  boutiqueId: string,
  vendeurId: string
): Promise<{ allowed: boolean; count: number; max: number }> {
  if (process.env.BILLING_ENABLED !== "true" && env.BILLING_ENABLED !== "true") {
    return { allowed: true, count: 0, max: 999999 };
  }
  const quotas = await getVendeurQuotas(vendeurId);

  const count = await prisma.produit.count({
    where: { boutiqueId },
  });

  return {
    allowed: count < quotas.maxProduits,
    count,
    max: quotas.maxProduits,
  };
}

export async function checkMembreCreationLimit(
  boutiqueId: string,
  vendeurId: string
): Promise<{ allowed: boolean; count: number; max: number }> {
  if (process.env.BILLING_ENABLED !== "true" && env.BILLING_ENABLED !== "true") {
    return { allowed: true, count: 0, max: 999999 };
  }
  const quotas = await getVendeurQuotas(vendeurId);

  const count = await prisma.membreBoutique.count({
    where: { boutiqueId },
  });

  return {
    allowed: count < quotas.maxMembres,
    count,
    max: quotas.maxMembres,
  };
}

export async function isPremiumFeatureAllowed(
  vendeurId: string,
  featureCode: string
): Promise<boolean> {
  if (process.env.BILLING_ENABLED !== "true" && env.BILLING_ENABLED !== "true") {
    return true;
  }
  const quotas = await getVendeurQuotas(vendeurId);
  // Only an actively-paying or trial-active plan unlocks premium features.
  // An EXPIRE/ANNULE plan falls back to starter capabilities.
  if (!quotas.isActive) {
    const starterFeatures = ["POS_SIMPLE", "STOCK_BASIQUE"];
    return starterFeatures.includes(featureCode);
  }
  if (quotas.codePlan === "ENTERPRISE") return true;
  if (quotas.codePlan === "PRO") {
    const allowedFeatures = [
      "POS_AVANCE",
      "VENTES_FLASH",
      "RAPPORTS_DETAILLES",
      "MARKETPLACE",
      "EXPORT",
      "STOCK_AVANCE",
      "MULTI_MEMBRES",
    ];
    return allowedFeatures.includes(featureCode);
  }
  const starterFeatures = ["POS_SIMPLE", "STOCK_BASIQUE"];
  return starterFeatures.includes(featureCode);
}

/**
 * Récupère les quotas du vendeur OWNER d'une boutique donnée.
 * Sert pour les pages côté boutique (ventes-flash, rapports, membres, etc.)
 * où l'on veut connaître le plan effectif de l'utilisateur consultant la boutique.
 */
export async function getBoutiqueOwnerQuotas(
  boutiqueId: string
): Promise<PlanQuotas> {
  const owner = await prisma.membreBoutique.findFirst({
    where: { boutiqueId, role: "OWNER" },
    select: { vendeurId: true },
  });
  if (!owner) {
    return {
      codePlan: "STARTER",
      nom: "Starter",
      maxBoutiques: 1,
      maxProduits: 50,
      maxMembres: 1,
      features: [],
      isActive: false,
      essaiFin: null,
      dateFin: null,
      statut: "EXPIRE",
    };
  }
  return getVendeurQuotas(owner.vendeurId);
}

/**
 * Vérifie si une boutique a accès au marketplace public (visibilité externe).
 * Vrai uniquement si le vendeur OWNER a un plan PRO ou ENTERPRISE actif.
 * Lorsque le billing est désactivé, retourne true (mode "sandbox" tout permis).
 */
export async function boutiqueHasMarketplaceAccess(
  boutiqueId: string
): Promise<boolean> {
  if (process.env.BILLING_ENABLED !== "true" && env.BILLING_ENABLED !== "true") {
    return true;
  }
  const quotas = await getBoutiqueOwnerQuotas(boutiqueId);
  return (
    quotas.isActive &&
    (quotas.codePlan === "PRO" || quotas.codePlan === "ENTERPRISE")
  );
}
