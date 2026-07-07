import {
  startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear,
  subDays, subMonths, differenceInCalendarDays,
} from "date-fns";

/**
 * Périodes du dashboard admin — parsées depuis l'URL (?p=…&du=…&au=…).
 * Chaque période fournit aussi la PÉRIODE PRÉCÉDENTE de même durée pour les
 * comparaisons (« vs période précédente »), recalculée côté serveur.
 */
export const PERIOD_KEYS = [
  "aujourdhui", "hier", "7j", "30j", "mois", "6mois", "annee", "perso",
] as const;
export type PeriodKey = (typeof PERIOD_KEYS)[number];

export interface Period {
  key: PeriodKey;
  from: Date;
  to: Date;
  prevFrom: Date;
  prevTo: Date;
}

function safeDate(s: string | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Période précédente contiguë de même durée. */
function previousOf(from: Date, to: Date): { prevFrom: Date; prevTo: Date } {
  const days = Math.max(1, differenceInCalendarDays(to, from) + 1);
  return {
    prevFrom: startOfDay(subDays(from, days)),
    prevTo: endOfDay(subDays(from, 1)),
  };
}

export function resolvePeriod(
  p?: string,
  du?: string,
  au?: string,
  now = new Date()
): Period {
  const key: PeriodKey = (PERIOD_KEYS as readonly string[]).includes(p ?? "")
    ? (p as PeriodKey)
    : "30j";

  let from: Date;
  let to: Date;

  switch (key) {
    case "aujourdhui":
      from = startOfDay(now); to = endOfDay(now); break;
    case "hier":
      from = startOfDay(subDays(now, 1)); to = endOfDay(subDays(now, 1)); break;
    case "7j":
      from = startOfDay(subDays(now, 6)); to = endOfDay(now); break;
    case "mois":
      from = startOfMonth(now); to = endOfDay(now); break;
    case "6mois":
      from = startOfDay(subMonths(now, 6)); to = endOfDay(now); break;
    case "annee":
      from = startOfYear(now); to = endOfDay(now); break;
    case "perso": {
      const d1 = safeDate(du);
      const d2 = safeDate(au);
      if (d1 && d2 && d1 <= d2) {
        from = startOfDay(d1); to = endOfDay(d2);
      } else {
        // Plage invalide → repli 30 jours (jamais d'erreur à l'écran).
        from = startOfDay(subDays(now, 29)); to = endOfDay(now);
      }
      break;
    }
    case "30j":
    default:
      from = startOfDay(subDays(now, 29)); to = endOfDay(now); break;
  }

  const { prevFrom, prevTo } = previousOf(from, to);
  return { key, from, to, prevFrom, prevTo };
}

/** Variation en % vs période précédente (null si base nulle → « — »). */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
