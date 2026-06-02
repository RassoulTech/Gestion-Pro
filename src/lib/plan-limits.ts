/**
 * Single source of truth for subscription plans.
 *
 * ⚠️ Modify limits HERE and HERE ONLY. Then:
 *   1. Run `npx tsx scripts/sync-plans.ts` to push to the database.
 *   2. Re-seed (`npx prisma db seed`) to refresh dev data.
 *
 * The Prisma seed, the marketing page, the pricing page, the dashboard quota
 * indicators, the upgrade modal and all backend quota checks read these
 * constants — there is no other place where these numbers should appear.
 */

export const UNLIMITED = 999_999;

export type PlanCode = "STARTER" | "PRO" | "ENTERPRISE";

export interface PlanDefinition {
  code: PlanCode;
  nom: string;
  prix: number;
  dureeEssaiJours: number;
  maxBoutiques: number;
  maxProduits: number;
  maxMembres: number;
  shortDescription: string;
  features: string[];
}

export const PLAN_DEFINITIONS: Record<PlanCode, PlanDefinition> = {
  STARTER: {
    code: "STARTER",
    nom: "Starter",
    prix: 0,
    dureeEssaiJours: 0,
    maxBoutiques: 1,
    maxProduits: 15,
    maxMembres: 1,
    shortDescription: "Pour démarrer et tester sans engagement.",
    features: [
      "1 boutique maximum",
      "15 produits maximum",
      "Gestion de stock basique",
      "POS simple",
      "Marketplace public",
      "Support email",
    ],
  },
  PRO: {
    code: "PRO",
    nom: "Pro",
    prix: 9_900,
    dureeEssaiJours: 90,
    maxBoutiques: 3,
    maxProduits: 40,
    maxMembres: 5,
    shortDescription: "Pour les commerces en pleine croissance.",
    features: [
      "3 boutiques maximum",
      "40 produits maximum",
      "POS avancé",
      "Gestion avancée du stock",
      "Mouvements de stock",
      "Rapports détaillés",
      "Export PDF / Excel",
      "QR Code Boutique",
      "Marketplace optimisé",
      "Support prioritaire",
    ],
  },
  ENTERPRISE: {
    code: "ENTERPRISE",
    nom: "Enterprise",
    prix: 19_900,
    dureeEssaiJours: 30,
    maxBoutiques: UNLIMITED,
    maxProduits: UNLIMITED,
    maxMembres: UNLIMITED,
    shortDescription: "Pour les réseaux de boutiques et multi-équipes.",
    features: [
      "Boutiques illimitées",
      "Produits illimités",
      "Toutes les fonctionnalités Pro",
      "Multi-boutiques avancé",
      "Membres et équipes illimités",
      "Rapports exécutifs",
      "API & intégrations",
      "Personnalisation avancée",
      "Marketplace premium",
      "Support prioritaire",
      "Onboarding dédié",
    ],
  },
};

export const PLAN_LIST: PlanDefinition[] = [
  PLAN_DEFINITIONS.STARTER,
  PLAN_DEFINITIONS.PRO,
  PLAN_DEFINITIONS.ENTERPRISE,
];

/** Returns true when the count value should be displayed as "Illimité". */
export function isUnlimited(value: number): boolean {
  return value >= UNLIMITED;
}

/** User-facing message when a quota is hit. */
export function getLimitReachedMessage(planCode: PlanCode): string {
  const plan = PLAN_DEFINITIONS[planCode];
  if (planCode === "STARTER") {
    return `Vous avez atteint la limite de votre forfait gratuit (${plan.maxBoutiques} boutique et ${plan.maxProduits} produits). Passez au forfait Pro pour développer votre activité.`;
  }
  if (planCode === "PRO") {
    return `Vous avez atteint la limite de votre forfait Pro (${plan.maxBoutiques} boutiques et ${plan.maxProduits} produits). Passez au forfait Enterprise pour bénéficier de capacités illimitées.`;
  }
  return "Limite atteinte. Contactez-nous si vous avez besoin d'augmenter vos capacités.";
}

/**
 * Stripe price IDs are read from env vars at runtime (not committed). This
 * helper centralizes the mapping so we can swap providers without scattering
 * env lookups.
 */
export function getStripePriceIds(code: PlanCode): {
  monthly: string | null;
  annual: string | null;
} {
  if (code === "PRO") {
    return {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "price_pro_monthly_mock",
      annual: process.env.STRIPE_PRICE_PRO_ANNUAL || "price_pro_annual_mock",
    };
  }
  if (code === "ENTERPRISE") {
    return {
      monthly:
        process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ||
        "price_enterprise_monthly_mock",
      annual:
        process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL ||
        "price_enterprise_annual_mock",
    };
  }
  return { monthly: null, annual: null };
}
