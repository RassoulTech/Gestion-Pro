"use client";

import React, { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Loader2, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** Presets de période — les valeurs correspondent aux clés de parseDateFilter. */
const PERIOD_PRESETS: { value: string; label: string }[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "3days", label: "3 derniers jours" },
  { value: "7days", label: "7 derniers jours" },
  { value: "15days", label: "15 derniers jours" },
  { value: "30days", label: "30 derniers jours" },
  { value: "thismonth", label: "Ce mois" },
  { value: "3months", label: "3 derniers mois" },
  { value: "thisyear", label: "Cette année" },
  { value: "all", label: "Toutes les données" },
  { value: "custom", label: "Personnalisé" },
];

export interface FilterSelectConfig {
  param: string;
  label: string;
  allLabel?: string;
  options: { value: string; label: string }[];
}

interface FilterPanelProps {
  /** Si défini, affiche une recherche débouncée liée à ?q dans la barre. */
  searchPlaceholder?: string;
  /** Affiche les presets de période (défaut: true). */
  showPeriod?: boolean;
  /**
   * Période appliquée par défaut côté serveur quand aucun `range` n'est dans
   * l'URL (ex. "30days"). Sert à refléter le bon preset actif et à garder l'URL
   * propre (sélectionner le défaut retire le param au lieu de l'ajouter).
   */
  defaultRange?: string;
  /** Filtres à choix (statut, type, source…) rendus en pills inline. */
  selects?: FilterSelectConfig[];
}

const PILL_BASE =
  "px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 text-left";

export function FilterPanel({
  searchPlaceholder,
  showPeriod = true,
  defaultRange,
  selects = [],
}: FilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const urlRange = searchParams.get("range") || "";
  const urlFrom = searchParams.get("from") || "";
  const urlTo = searchParams.get("to") || "";
  const urlSearch = searchParams.get("q") || "";

  // ── Recherche : input débouncé instantané (séparé du brouillon) ───────────
  const [searchValue, setSearchValue] = useState(urlSearch);
  useEffect(() => {
    setSearchValue(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    if (searchValue === urlSearch) return;
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue) params.set("q", searchValue);
      else params.delete("q");
      params.delete("page");
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    }, 400);
    return () => clearTimeout(t);
  }, [searchValue, urlSearch, pathname, router, searchParams]);

  // ── Brouillon des filtres structurels (période + selects) ─────────────────
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState(urlRange || defaultRange || "");
  const [draftFrom, setDraftFrom] = useState(urlFrom);
  const [draftTo, setDraftTo] = useState(urlTo);
  const [draftSelects, setDraftSelects] = useState<Record<string, string>>({});

  // (Ré)initialise le brouillon depuis l'URL à chaque ouverture
  const syncDraftFromUrl = useCallback(() => {
    setDraftRange(urlRange || defaultRange || "");
    setDraftFrom(urlFrom);
    setDraftTo(urlTo);
    const next: Record<string, string> = {};
    for (const s of selects) next[s.param] = searchParams.get(s.param) || "";
    setDraftSelects(next);
  }, [urlRange, urlFrom, urlTo, defaultRange, selects, searchParams]);

  const handleOpenChange = (v: boolean) => {
    if (v) syncDraftFromUrl();
    setOpen(v);
  };

  const applyDraft = () => {
    const params = new URLSearchParams(searchParams.toString());

    // Recherche en cours (capture le texte non encore débouncé)
    if (searchValue) params.set("q", searchValue);
    else params.delete("q");

    if (showPeriod) {
      if (draftRange && draftRange !== "custom" && draftRange !== defaultRange) {
        params.set("range", draftRange);
        params.delete("from");
        params.delete("to");
      } else if (draftRange === "custom" && draftFrom && draftTo) {
        params.set("range", "custom");
        params.set("from", draftFrom);
        params.set("to", draftTo);
      } else {
        params.delete("range");
        params.delete("from");
        params.delete("to");
      }
    }

    for (const s of selects) {
      const v = draftSelects[s.param];
      if (v && v !== "ALL" && v !== "all") params.set(s.param, v);
      else params.delete(s.param);
    }

    params.delete("page");
    setOpen(false);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const resetAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    ["q", "range", "from", "to", "page"].forEach((k) => params.delete(k));
    for (const s of selects) params.delete(s.param);
    setSearchValue("");
    setOpen(false);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  // Supprime un filtre actif (chip) — application immédiate
  const removeParams = (keys: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    keys.forEach((k) => params.delete(k));
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  // ── Chips de filtres actifs ───────────────────────────────────────────────
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (showPeriod && urlRange) {
      const preset = PERIOD_PRESETS.find((p) => p.value === urlRange);
      const label =
        urlRange === "custom" && urlFrom && urlTo
          ? `${urlFrom.split("-").reverse().join("/")} → ${urlTo.split("-").reverse().join("/")}`
          : preset?.label ?? urlRange;
      chips.push({
        key: "period",
        label: `Période : ${label}`,
        onRemove: () => removeParams(["range", "from", "to"]),
      });
    }
    for (const s of selects) {
      const v = searchParams.get(s.param);
      if (v && v !== "ALL" && v !== "all") {
        const opt = s.options.find((o) => o.value === v);
        chips.push({
          key: s.param,
          label: `${s.label} : ${opt?.label ?? v}`,
          onRemove: () => removeParams([s.param]),
        });
      }
    }
    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPeriod, urlRange, urlFrom, urlTo, selects, searchParams]);

  const activeCount = activeChips.length;

  // ── Champs du panneau (partagés desktop Popover / mobile Sheet) ───────────
  const panelFields = (
    <div className="space-y-6">
      {showPeriod && (
        <div className="space-y-2.5">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            Période
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PERIOD_PRESETS.map((p) => {
              const active = draftRange === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setDraftRange(p.value)}
                  className={cn(
                    PILL_BASE,
                    active
                      ? "bg-brand text-white border-transparent shadow-sm"
                      : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          {draftRange === "custom" && (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Du
                </label>
                <Input
                  type="date"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className="h-10 rounded-xl font-bold text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Au
                </label>
                <Input
                  type="date"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="h-10 rounded-xl font-bold text-xs"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {selects.map((s) => {
        const current = draftSelects[s.param] ?? "";
        const isAll = !current || current === "ALL" || current === "all";
        return (
          <div key={s.param} className="space-y-2.5">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              {s.label}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDraftSelects((d) => ({ ...d, [s.param]: "" }))}
                className={cn(
                  PILL_BASE,
                  isAll
                    ? "bg-brand text-white border-transparent shadow-sm"
                    : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                )}
              >
                {s.allLabel ?? "Tous"}
              </button>
              {s.options.map((o) => {
                const active = current === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setDraftSelects((d) => ({ ...d, [s.param]: o.value }))}
                    className={cn(
                      PILL_BASE,
                      active
                        ? "bg-brand text-white border-transparent shadow-sm"
                        : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                    )}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  const footer = (
    <div className="flex items-center gap-3 pt-2">
      <Button
        type="button"
        variant="outline"
        onClick={resetAll}
        className="flex-1 h-11 rounded-xl font-bold border-slate-200 dark:border-zinc-800"
      >
        <RotateCcw className="mr-2 h-4 w-4 text-slate-400" />
        Réinitialiser
      </Button>
      <Button
        type="button"
        onClick={applyDraft}
        className="flex-1 h-11 rounded-xl font-black bg-brand text-white shadow-md shadow-brand/10"
      >
        <Check className="mr-2 h-4 w-4" />
        Appliquer
      </Button>
    </div>
  );

  const triggerButton = (
    <Button
      variant="outline"
      className="h-11 sm:h-12 rounded-xl font-extrabold border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 gap-2 shrink-0"
    >
      <SlidersHorizontal className="h-4 w-4 text-orange-500" />
      Filtres
      {activeCount > 0 && (
        <span className="ml-0.5 h-5 min-w-5 px-1.5 rounded-full bg-brand text-white text-[10px] font-black flex items-center justify-center">
          {activeCount}
        </span>
      )}
    </Button>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {searchPlaceholder && (
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-10 h-11 sm:h-12 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 font-bold text-xs sm:text-sm w-full"
            />
            {isPending && (
              <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
            )}
          </div>
        )}

        {/* Desktop : Popover déroulant */}
        <div className="hidden lg:block">
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-[min(360px,calc(100vw-1.5rem))] p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 max-h-[70vh] overflow-y-auto overscroll-contain z-50"
            >
              {panelFields}
              <div className="sticky bottom-0 -mx-4 -mb-4 mt-4 px-4 pb-4 pt-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-t border-slate-100 dark:border-zinc-800">
                {footer}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Mobile / tablette : Sheet bas */}
        <div className="lg:hidden">
          <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>{triggerButton}</SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-[1.75rem] max-h-[85vh] overflow-y-auto overscroll-contain p-5 flex flex-col"
            >
              <SheetHeader className="text-left pb-2">
                <SheetTitle className="flex items-center gap-2 font-black">
                  <SlidersHorizontal className="h-5 w-5 text-orange-500" />
                  Filtres
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1">{panelFields}</div>
              <div className="sticky bottom-0 -mx-5 -mb-5 mt-4 px-5 pb-5 pt-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-t border-slate-100 dark:border-zinc-800">
                {footer}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Chips de filtres actifs */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
            >
              {chip.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={resetAll}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 underline underline-offset-2"
          >
            Tout effacer
          </button>
        </div>
      )}
    </div>
  );
}
