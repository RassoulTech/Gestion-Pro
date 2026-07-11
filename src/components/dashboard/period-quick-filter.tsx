"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { vendorGlobalCookieString } from "@/lib/global-filter";

/**
 * Filtre de période premium "pills" (7j / 30j / Perso).
 *
 * Présentation pure : pilote EXACTEMENT les mêmes paramètres d'URL (`range`,
 * `from`, `to`) que le serveur sait lire via parseDateFilter — aucune logique
 * métier modifiée. « Perso » ouvre un popover contenant tous les presets +
 * une plage de dates personnalisée (aucune fonctionnalité perdue).
 */

const PRESETS = [
  { value: "today", label: "Aujourd'hui" },
  { value: "yesterday", label: "Hier" },
  { value: "3days", label: "3 jours" },
  { value: "7days", label: "7 jours" },
  { value: "15days", label: "15 jours" },
  { value: "30days", label: "30 jours" },
  { value: "thismonth", label: "Ce mois" },
  { value: "lastmonth", label: "Mois préc." },
  { value: "3months", label: "3 mois" },
  { value: "6months", label: "6 mois" },
  { value: "thisyear", label: "Année" },
  { value: "all", label: "Tout" },
] as const;

export function PeriodQuickFilter({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();
  const [open, setOpen] = React.useState(false);

  const current = searchParams.get("range") || "30days";
  const urlFrom = searchParams.get("from") || "";
  const urlTo = searchParams.get("to") || "";
  const [tempFrom, setTempFrom] = React.useState(urlFrom);
  const [tempTo, setTempTo] = React.useState(urlTo);

  React.useEffect(() => {
    setTempFrom(urlFrom);
    setTempTo(urlTo);
  }, [urlFrom, urlTo]);

  const pushRange = (value: string, from?: string, to?: string) => {
    // FILTRE GLOBAL : la période choisie sur le DASHBOARD devient celle de
    // toute la session (cookie lu en repli par toutes les pages sans réglage
    // local). Les autres pages gardent leur priorité URL (affinage local).
    document.cookie = vendorGlobalCookieString(value || "30days", from, to);
    const params = new URLSearchParams(searchParams.toString());
    // range=30days est le défaut serveur → on retire le param pour une URL propre.
    if (value && value !== "30days") params.set("range", value);
    else params.delete("range");
    if (from) params.set("from", from);
    else params.delete("from");
    if (to) params.set("to", to);
    else params.delete("to");
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const isWeek = current === "7days";
  const isMonth = current === "30days";
  const isCustom = !isWeek && !isMonth;
  const customLabel =
    current === "custom"
      ? "Perso"
      : (PRESETS.find((p) => p.value === current)?.label ?? "Perso");

  const pill =
    "relative flex-1 sm:flex-initial h-9 px-3.5 rounded-full text-xs font-extrabold transition-all duration-200 inline-flex items-center justify-center gap-1.5 whitespace-nowrap";
  const active = "bg-card text-foreground shadow-sm ring-1 ring-border/60";
  const inactive = "text-muted-foreground hover:text-foreground";

  return (
    <div
      className={cn(
        "inline-flex w-full items-center gap-1 rounded-full bg-muted p-1 sm:w-auto",
        isPending && "opacity-70",
        className
      )}
    >
      <button type="button" onClick={() => pushRange("7days")} className={cn(pill, isWeek ? active : inactive)}>
        7j
      </button>
      <button type="button" onClick={() => pushRange("30days")} className={cn(pill, isMonth ? active : inactive)}>
        30j
      </button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className={cn(pill, isCustom ? active : inactive)}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="truncate max-w-[80px]">{isCustom ? customLabel : "Perso"}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={10}
          className="w-[300px] rounded-2xl border-border/60 p-4 shadow-xl"
        >
          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Périodes
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  pushRange(p.value);
                  setOpen(false);
                }}
                className={cn(
                  "h-8 rounded-lg px-1 text-[11px] font-bold transition-colors",
                  current === p.value
                    ? "bg-brand text-brand-foreground shadow-sm"
                    : "bg-muted text-foreground hover:bg-accent"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="my-4 h-px bg-border" />

          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Plage personnalisée
          </p>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={tempFrom}
              onChange={(e) => setTempFrom(e.target.value)}
              aria-label="Date de début"
              className="h-10 w-full rounded-xl border border-border bg-muted px-2.5 text-xs font-bold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span className="text-xs font-bold text-muted-foreground">→</span>
            <input
              type="date"
              value={tempTo}
              onChange={(e) => setTempTo(e.target.value)}
              aria-label="Date de fin"
              className="h-10 w-full rounded-xl border border-border bg-muted px-2.5 text-xs font-bold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button
            type="button"
            onClick={() => {
              pushRange("custom", tempFrom, tempTo);
              setOpen(false);
            }}
            disabled={!tempFrom && !tempTo}
            className="mt-3 h-10 w-full rounded-xl font-extrabold"
            variant="brand"
          >
            Appliquer
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
