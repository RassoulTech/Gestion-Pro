import "server-only";

import { cookies } from "next/headers";
import { resolvePeriod, type Period, type PeriodKey } from "@/lib/periods";
import {
  GLOBAL_FILTER_COOKIE_ADMIN,
  resolveCanonicalParams,
  type FilterSource,
} from "@/lib/global-filter";

/**
 * Résolution de la période d'une page ADMIN :
 * URL (?p/du/au = réglage local) > filtre GLOBAL de session (cookie posé par
 * le dashboard) > défaut de la page. À utiliser avec <PeriodFilter/>.
 */
export async function resolvePagePeriod(
  sp: { p?: string; du?: string; au?: string },
  defaultKey: PeriodKey = "30j"
): Promise<{ period: Period; source: FilterSource; fromIso: string; toIso: string }> {
  const raw = (await cookies()).get(GLOBAL_FILTER_COOKIE_ADMIN)?.value;
  const eff = resolveCanonicalParams(sp, raw ? decodeURIComponent(raw) : undefined, defaultKey);
  const period = resolvePeriod(eff.p, eff.du, eff.au);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { period, source: eff.source, fromIso: iso(period.from), toIso: iso(period.to) };
}
