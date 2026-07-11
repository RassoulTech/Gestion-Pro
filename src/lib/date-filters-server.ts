import "server-only";

import { cookies } from "next/headers";
import { parseDateFilter, type DateFilterResult } from "@/lib/date-filters";
import { GLOBAL_FILTER_COOKIE, globalCookieToVendorRange } from "@/lib/global-filter";

/**
 * `parseDateFilter` + FILTRE GLOBAL : si la page n'a AUCUN réglage local
 * (`?range=` absent), la période globale posée par le dashboard (cookie
 * `gp_filtre`) s'applique ; sinon défaut habituel (30 jours). L'URL reste
 * prioritaire → l'affinage local d'une page ne casse jamais le global.
 */
export async function parseDateFilterWithGlobal(
  range: string | undefined,
  from: string | undefined,
  to: string | undefined
): Promise<DateFilterResult> {
  if (!range) {
    const raw = (await cookies()).get(GLOBAL_FILTER_COOKIE)?.value;
    const g = globalCookieToVendorRange(raw ? decodeURIComponent(raw) : undefined);
    if (g) return parseDateFilter(g.range, g.from, g.to);
  }
  return parseDateFilter(range, from, to);
}
