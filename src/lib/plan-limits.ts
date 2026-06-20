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

export interface FeatureItem {
  text: string;
  included: boolean;
}

export interface PlanDefinition {
  code: PlanCode;
  nom: string;
  prix: number;
  dureeEssaiJours: number;
  maxBoutiques: number;
  maxProduits: number;
  maxMembres: number;
  shortDescription: string;
  features: FeatureItem[];
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
      { text: "1 boutique maximum", included: true },
      { text: "15 produits maximum", included: true },
      { text: "Gestion des commandes", included: true },
      { text: "Gestion de stock basique", included: true },
      { text: "Marketplace publique", included: true },
      { text: "Support par email", included: true },
      { text: "Multi-boutiques", included: false },
      { text: "Export PDF / Excel", included: false },
      { text: "Rapports avancés", included: false },
      { text: "QR Code boutique", included: false },
      { text: "Support prioritaire", included: false },
      { text: "Produits illimités", included: false },
      { text: "Membres illimités", included: false },
    ],
  },
  PRO: {
    code: "PRO",
    nom: "Pro",
    prix: 6_900,
    dureeEssaiJours: 90,
    maxBoutiques: 3,
    maxProduits: 40,
    maxMembres: 5,
    shortDescription: "Pour les commerces en pleine croissance.",
    features: [
      { text: "Jusqu'à 3 boutiques", included: true },
      { text: "Jusqu'à 40 produits", included: true },
      { text: "POS avancé", included: true },
      { text: "Gestion avancée du stock", included: true },
      { text: "Rapports détaillés", included: true },
      { text: "Export PDF / Excel", included: true },
      { text: "QR Code boutique", included: true },
      { text: "Marketplace optimisée", included: true },
      { text: "Support prioritaire", included: true },
      { text: "Boutiques illimitées", included: false },
      { text: "Produits illimités", included: false },
      { text: "Membres illimités", included: false },
    ],
  },
  ENTERPRISE: {
    code: "ENTERPRISE",
    nom: "Enterprise",
    prix: 14_900,
    dureeEssaiJours: 30,
    maxBoutiques: UNLIMITED,
    maxProduits: UNLIMITED,
    maxMembres: UNLIMITED,
    shortDescription: "Pour les réseaux de boutiques et multi-équipes.",
    features: [
      { text: "Boutiques illimitées", included: true },
      { text: "Produits illimités", included: true },
      { text: "Toutes les fonctionnalités du plan Pro", included: true },
      { text: "Membres ou équipe illimités", included: true },
      { text: "Rapports & Analyses consolidés", included: true },
      { text: "Export complet PDF / Excel", included: true },
      { text: "Marketplace optimisée", included: true },
      { text: "QR Code boutique personnalisé", included: true },
      { text: "Support VIP prioritaire par WhatsApp", included: true },
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


