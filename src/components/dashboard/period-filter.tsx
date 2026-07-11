"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { CalendarRange, Check, Loader2, Globe2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { PeriodKey } from "@/lib/periods";
import {
  globalFilterCookieString,
  type FilterSource,
} from "@/lib/global-filter";

const OPTIONS: { key: PeriodKey; labelKey: string }[] = [
  { key: "aujourdhui", labelKey: "today" },
  { key: "hier", labelKey: "yesterday" },
  { key: "7j", labelKey: "d7" },
  { key: "30j", labelKey: "d30" },
  { key: "mois", labelKey: "thisMonth" },
  { key: "6mois", labelKey: "m6" },
  { key: "annee", labelKey: "year" },
];

/**
 * Filtre de période premium du dashboard admin : sélecteur segmenté animé +
 * plage personnalisée (calendrier natif stylé, utilisable au doigt). Piloté
 * par l'URL (?p=…&du=…&au=…) → toutes les données de la page (rendu serveur)
 * suivent, avec transition douce (useTransition + indicateur discret).
 */
export function PeriodFilter({
  active,
  from,
  to,
  source = "local",
  writesGlobal = false,
  extra,
}: {
  active: PeriodKey;
  /** Bornes résolues (ISO yyyy-MM-dd) — pour l'affichage et le mode perso. */
  from: string;
  to: string;
  /** Provenance du filtre appliqué (badge discret + « Revenir au global »). */
  source?: FilterSource;
  /** Dashboard = setter : chaque choix devient le filtre GLOBAL de session. */
  writesGlobal?: boolean;
  /** Critères additionnels propres à la page (mêmes styles, même barre). */
  extra?: React.ReactNode;
}) {
  const t = useTranslations("periodFilter");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [openPerso, setOpenPerso] = useState(false);
  const [du, setDu] = useState(from);
  const [au, setAu] = useState(to);

  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "en" ? "en-US" : "fr-FR", {
        day: "numeric", month: "short", year: "numeric",
      }),
    [locale]
  );
  const periodLabel = `${fmt.format(new Date(`${from}T00:00:00`))} → ${fmt.format(new Date(`${to}T00:00:00`))}`;

  function apply(params: Record<string, string | null>) {
    // Dashboard = setter du FILTRE GLOBAL de session (cookie lu par toutes
    // les pages sans réglage local).
    if (writesGlobal) {
      const p = (params.p ?? "30j") as PeriodKey;
      document.cookie = globalFilterCookieString({
        p,
        du: params.du ?? undefined,
        au: params.au ?? undefined,
      });
    }
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(params)) {
      if (v) next.set(k, v); else next.delete(k);
    }
    next.delete("page"); // la pagination repart proprement à la 1ʳᵉ page
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  /** Efface le réglage local → la page retombe sur le filtre global. */
  function backToGlobal() {
    apply({ p: null, du: null, au: null });
  }

  return (
    <div className="sticky top-2 z-30 space-y-2 rounded-2xl border border-border/70 bg-background/75 p-3 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-wrap items-center gap-2">
        {/* Sélecteur segmenté */}
        <div className="scrollbar-none -mx-1 flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1 shadow-sm">
          {OPTIONS.map((o) => {
            const isActive = active === o.key;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => apply({ p: o.key, du: null, au: null })}
                aria-pressed={isActive}
                className={cn(
                  "whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200",
                  isActive
                    ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {t(o.labelKey)}
              </button>
            );
          })}

          {/* Personnalisé */}
          <Popover open={openPerso} onOpenChange={setOpenPerso}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-pressed={active === "perso"}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200",
                  active === "perso"
                    ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <CalendarRange className="h-3.5 w-3.5" />
                {t("custom")}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 rounded-2xl p-4">
              <p className="mb-3 text-xs font-black uppercase tracking-wider text-muted-foreground">
                {t("customTitle")}
              </p>
              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground">{t("from")}</span>
                  <input
                    type="date" value={du} max={au || undefined}
                    onChange={(e) => setDu(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground">{t("to")}</span>
                  <input
                    type="date" value={au} min={du || undefined}
                    onChange={(e) => setAu(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold"
                  />
                </label>
                <Button
                  className="h-11 w-full rounded-xl font-black" variant="brand"
                  disabled={!du || !au || du > au}
                  onClick={() => { setOpenPerso(false); apply({ p: "perso", du, au }); }}
                >
                  <Check className="mr-2 h-4 w-4" /> {t("apply")}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Critères additionnels propres à la page (même barre, même style) */}
        {extra}

        {/* Indicateur discret pendant la mise à jour */}
        {pending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label={t("loading")} />}
      </div>

      {/* Période active + provenance (global / réglage local) */}
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-bold text-muted-foreground">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brand align-middle" />
          {periodLabel}
        </p>
        {!writesGlobal && source === "global" && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-black text-muted-foreground">
            <Globe2 className="h-3 w-3 text-brand" /> Filtre global
          </span>
        )}
        {!writesGlobal && source === "local" && (
          <>
            <span className="inline-flex items-center rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[10px] font-black text-brand">
              Réglage local
            </span>
            <button
              type="button"
              onClick={backToGlobal}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              <Undo2 className="h-3 w-3" /> Revenir au filtre global
            </button>
          </>
        )}
      </div>
    </div>
  );
}
