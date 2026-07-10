import type { PlanCode } from "@/lib/plan-limits";

/**
 * SOURCE UNIQUE DE VÉRITÉ des capacités par plan (essai vs forfaits payants).
 * Toute nouvelle restriction/capacité s'ajoute ICI et se consomme partout via
 * les helpers — jamais de test de plan dispersé dans les composants/actions.
 *
 * ⚠️ Les vérifications d'accès restent CÔTÉ SERVEUR (actions, services,
 * layouts) ; l'interface ne fait que refléter ces droits.
 */

/** Durée de l'essai gratuit (plan STARTER), en jours. */
export const TRIAL_DAYS = 15;

export interface PlanCapabilities {
  /** Facturation : génération auto + PDF/impression/envoi (WhatsApp, e-mail). */
  facturation: boolean;
}

export const PLAN_CAPABILITIES: Record<PlanCode, PlanCapabilities> = {
  STARTER: { facturation: false }, // essai 15 jours
  PRO: { facturation: true },
  ENTERPRISE: { facturation: true },
};

function capabilitiesOf(codePlan: string): PlanCapabilities {
  return PLAN_CAPABILITIES[(codePlan as PlanCode) in PLAN_CAPABILITIES ? (codePlan as PlanCode) : "STARTER"];
}

/**
 * La facturation exige un forfait PAYANT actif : un plan payant expiré ou un
 * essai (même en cours) n'y donnent pas droit.
 */
export function canUseFacturation(quotas: { codePlan: string; isActive: boolean; statut: string }): boolean {
  return quotas.isActive && quotas.statut === "ACTIF" && capabilitiesOf(quotas.codePlan).facturation;
}

/** Message unique affiché quand la facturation est réservée aux forfaits payants. */
export const FACTURATION_LOCKED_MESSAGE =
  "La facturation est disponible avec un forfait payant. Passez à un forfait pour générer, imprimer et envoyer vos factures.";

/** Message unique de fin d'essai (blocage serveur). */
export const TRIAL_EXPIRED_MESSAGE =
  "Votre période d'essai de 15 jours est terminée. Souscrivez un forfait pour retrouver l'accès à votre boutique — vos données sont conservées.";
