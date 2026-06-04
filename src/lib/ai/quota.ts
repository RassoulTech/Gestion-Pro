import "server-only";

import { prisma } from "@/lib/prisma";
import { getVendeurQuotas } from "@/lib/quotas";
import { UNLIMITED, type PlanCode } from "@/lib/plan-limits";

/** Quota mensuel de générations IA par forfait. */
export const AI_MONTHLY_QUOTA: Record<PlanCode, number> = {
  STARTER: 5,
  PRO: 100,
  ENTERPRISE: UNLIMITED,
};

/** Mois courant au format "AAAA-MM". */
export function currentMonth(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export interface AiQuotaState {
  codePlan: PlanCode;
  quota: number;
  used: number;
  remaining: number;
  unlimited: boolean;
}

/** État du quota IA du vendeur pour le mois courant. */
export async function getAiQuotaState(userId: string, vendeurId: string): Promise<AiQuotaState> {
  const quotas = await getVendeurQuotas(vendeurId);
  const code = (quotas.codePlan as PlanCode) || "STARTER";
  const quota = AI_MONTHLY_QUOTA[code] ?? AI_MONTHLY_QUOTA.STARTER;
  const unlimited = quota >= UNLIMITED;
  const usage = await prisma.aiUsage.findUnique({
    where: { userId_month: { userId, month: currentMonth() } },
  });
  const used = usage?.usageCount ?? 0;
  return {
    codePlan: code,
    quota,
    used,
    remaining: unlimited ? UNLIMITED : Math.max(0, quota - used),
    unlimited,
  };
}

/** Lève une erreur si le quota mensuel est atteint. */
export async function assertAiQuota(userId: string, vendeurId: string): Promise<AiQuotaState> {
  const state = await getAiQuotaState(userId, vendeurId);
  if (!state.unlimited && state.remaining <= 0) {
    throw new Error(
      `Quota IA mensuel atteint (${state.quota} générations ce mois-ci). Passez à un forfait supérieur pour en obtenir davantage.`
    );
  }
  return state;
}

/** Incrémente le compteur d'usage du mois courant (upsert atomique). */
export async function incrementAiUsage(userId: string, quota: number): Promise<void> {
  const month = currentMonth();
  await prisma.aiUsage.upsert({
    where: { userId_month: { userId, month } },
    create: { userId, month, usageCount: 1, quota },
    update: { usageCount: { increment: 1 }, quota },
  });
}
