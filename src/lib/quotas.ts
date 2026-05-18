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
  statut: "ESSAI" | "ACTIF" | "EXPIRE" | "ANNULE";
}

const DEFAULT_UNLIMITED_PLAN: PlanQuotas = {
  codePlan: "ENTERPRISE",
  nom: "Enterprise (Billing Disabled)",
  maxBoutiques: 999999,
  maxProduits: 999999,
  maxMembres: 999999,
  features: ["Boutiques illimitées", "Produits illimités", "Membres illimités"],
  isActive: true,
  essaiFin: null,
  dateFin: null,
  statut: "ACTIF",
};

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
  // 1. If billing is disabled, bypass all quotas and return unlimited
  if (process.env.BILLING_ENABLED !== "true" && env.BILLING_ENABLED !== "true") {
    return DEFAULT_UNLIMITED_PLAN;
  }

  // 2. Check memory cache
  const cached = quotaCache.get(vendeurId);
  if (cached && Date.now() - cached.timestamp < 300000) {
    return cached.data;
  }

  // 3. Query active subscription in Database
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
      where: { codePlan: "STARTER" } as any,
    });

    result = {
      codePlan: "STARTER",
      nom: starterPlan?.nom || "Starter",
      maxBoutiques: starterPlan?.maxBoutiques ?? 1,
      maxProduits: starterPlan?.maxProduits ?? 50,
      maxMembres: (starterPlan as any)?.maxMembres ?? 1,
      features: (starterPlan?.features as string[]) || ["1 boutique max", "50 produits max"],
      isActive: false, // No active paying subscription
      essaiFin: null,
      dateFin: null,
      statut: "EXPIRE",
    };
  } else {
    // Check if active subscription has expired manually (safeguard)
    const isTrialExpired =
      activeSubscription.statut === "ESSAI" &&
      activeSubscription.essaiFin &&
      new Date() > activeSubscription.essaiFin;

    const isPlanExpired =
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
        where: { codePlan: "STARTER" } as any,
      });

      result = {
        codePlan: "STARTER",
        nom: starterPlan?.nom || "Starter",
        maxBoutiques: starterPlan?.maxBoutiques ?? 1,
        maxProduits: starterPlan?.maxProduits ?? 50,
        maxMembres: (starterPlan as any)?.maxMembres ?? 1,
        features: (starterPlan?.features as string[]) || ["1 boutique max", "50 produits max"],
        isActive: false,
        essaiFin: null,
        dateFin: null,
        statut: "EXPIRE",
      };
    } else {
      result = {
        codePlan: (activeSubscription.plan as any).codePlan || "STARTER",
        nom: activeSubscription.plan.nom,
        maxBoutiques: activeSubscription.plan.maxBoutiques,
        maxProduits: activeSubscription.plan.maxProduits,
        maxMembres: (activeSubscription.plan as any).maxMembres,
        features: (activeSubscription.plan.features as string[]) || [],
        isActive: true,
        essaiFin: activeSubscription.essaiFin,
        dateFin: activeSubscription.dateFin,
        statut: activeSubscription.statut as any,
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
  const quotas = await getVendeurQuotas(vendeurId);
  if (quotas.codePlan === "ENTERPRISE") return true;
  if (quotas.codePlan === "PRO") {
    // Pro allowed features: advanced stock, sales report, marketplace, etc.
    const allowedFeatures = ["POS_AVANCE", "VENTES_FLASH", "RAPPORTS_DETAILLES", "MARKETPLACE", "EXPORT"];
    return allowedFeatures.includes(featureCode);
  }
  // Starter allowed features
  const starterFeatures = ["POS_SIMPLE", "STOCK_BASIQUE"];
  return starterFeatures.includes(featureCode);
}
