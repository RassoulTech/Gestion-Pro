"use client";

import React, { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { GLOBAL_FILTER_COOKIE, globalCookieToVendorRange, vendorGlobalCookieString } from "@/lib/global-filter";
import { Globe } from "lucide-react";

/**
 * Presets de période — les valeurs correspondent aux clés de parseDateFilter
 * ET aux clés de traduction `filters.presets.*` (les libellés sont résolus via
 * next-intl à l'exécution).
 */
const PERIOD_VALUES = [
  "today",
  "3days",
  "7days",
  "15days",
  "30days",
  "thismonth",
  "3months",
  "6months",
  "thisyear",
  "all",
  "custom",
] as const;

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
  /** Dashboard = setter : chaque période choisie devient le filtre GLOBAL. */
  writesGlobal?: boolean;
}

const PILL_BASE =
  "px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 text-left";

export function FilterPanel({
  searchPlaceholder,
  showPeriod = true,
  defaultRange,
  selects = [],
  writesGlobal = false,
}: FilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("filters");
  const [isPending, startTransition] = useTransition();

  const urlRange = searchParams.get("range") || "";
  const urlFrom = searchParams.get("from") || "";
  const urlTo = searchParams.get("to") || "";
  const urlSearch = searchParams.get("q") || "";

  // ── FILTRE GLOBAL de session (cookie posé par le dashboard) ──────────────
  // Sans réglage local dans l'URL, le serveur applique le global : on lit le
  // cookie côté client uniquement pour le BADGE et l'affichage du preset actif.
  const [globalRange, setGlobalRange] = useState<string | null>(null);
  useEffect(() => {
    const m = document.cookie.match(new RegExp(`(?:^|; )${GLOBAL_FILTER_COOKIE}=([^;]+)`));
    const g = m?.[1] ? globalCookieToVendorRange(decodeURIComponent(m[1])) : null;
    setGlobalRange(g?.range ?? null);
  }, [searchParams]);
  const hasLocal = Boolean(urlRange || urlFrom || urlTo);
  const filterSource: "local" | "global" | "defaut" = hasLocal
    ? "local"
    : globalRange
      ? "global"
      : "defaut";

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
      const isKnownPreset = (PERIOD_VALUES as readonly string[]).includes(urlRange);
      const label =
        urlRange === "custom" && urlFrom && urlTo
          ? `${urlFrom.split("-").reverse().join("/")} → ${urlTo.split("-").reverse().join("/")}`
          : isKnownPreset
            ? t(`presets.${urlRange}`)
            : urlRange;
      chips.push({
        key: "period",
        label: t("periodChip", { value: label }),
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
          <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
            {t("period")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PERIOD_VALUES.map((p) => {
              const active = draftRange === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDraftRange(p)}
                  className={cn(
                    PILL_BASE,
                    active
                      ? "bg-brand text-white border-transparent shadow-sm"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                  )}
                >
                  {t(`presets.${p}`)}
                </button>
              );
            })}
          </div>
          {draftRange === "custom" && (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  {t("from")}
                </label>
                <Input
                  type="date"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className="h-10 rounded-xl font-bold text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  {t("to")}
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
            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
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
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                )}
              >
                {s.allLabel ?? t("all")}
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
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
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
        className="flex-1 h-11 rounded-xl font-bold border-zinc-200 dark:border-zinc-800"
      >
        <RotateCcw className="mr-2 h-4 w-4 text-zinc-400" />
        {t("reset")}
      </Button>
      <Button
        type="button"
        onClick={applyDraft}
        className="flex-1 h-11 rounded-xl font-black bg-brand text-white shadow-md shadow-brand/10"
      >
        <Check className="mr-2 h-4 w-4" />
        {t("apply")}
      </Button>
    </div>
  );

  const triggerButton = (
    <Button
      variant="outline"
      className="h-11 sm:h-12 rounded-xl font-extrabold border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 gap-2 shrink-0"
    >
      <SlidersHorizontal className="h-4 w-4 text-orange-500" />
      {t("filters")}
      {activeCount > 0 && (
        <span className="ml-0.5 h-5 min-w-5 px-1.5 rounded-full bg-brand text-white text-[10px] font-black flex items-center justify-center">
          {activeCount}
        </span>
      )}
    </Button>
  );

  return (
    <div className="sticky top-2 z-30 space-y-3 rounded-2xl border border-border/70 bg-background/75 p-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      {/* Provenance du filtre (global vs réglage local) */}
      {filterSource !== "defaut" && (
        <div className="flex flex-wrap items-center gap-2">
          {filterSource === "global" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-black text-muted-foreground">
              <Globe className="h-3 w-3 text-brand" /> Filtre global
              {globalRange && (PERIOD_VALUES as readonly string[]).includes(globalRange)
                ? ` · ${t(`presets.${globalRange}`)}`
                : ""}
            </span>
          ) : (
            <>
              <span className="inline-flex items-center rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[10px] font-black text-brand">
                Réglage local
              </span>
              <button
                type="button"
                onClick={() => removeParams(["range", "from", "to"])}
                className="text-[11px] font-bold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Revenir au filtre global
              </button>
            </>
          )}
        </div>
      )}
      {/* Période — SEGMENTS VISIBLES (mêmes styles que l'admin), application immédiate.
          Actif = réglage local (URL) > filtre GLOBAL (cookie) > défaut de la page. */}
      {showPeriod && (
        <div className="scrollbar-none -mx-1 flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1 shadow-sm">
          {(["today", "yesterday", "7days", "30days", "thismonth", "6months", "thisyear"] as const).map((v) => {
            const effective = urlRange || globalRange || defaultRange || "30days";
            const isActive = effective === v;
            return (
              <button
                key={v}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  if (writesGlobal) document.cookie = vendorGlobalCookieString(v);
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("range", v);
                  params.delete("from");
                  params.delete("to");
                  params.delete("page");
                  startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
                }}
                className={cn(
                  "whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200",
                  isActive
                    ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {t(`presets.${v}`)}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={urlRange === "custom"}
            onClick={() => handleOpenChange(true)}
            className={cn(
              "whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200",
              urlRange === "custom"
                ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t("presets.custom")}
          </button>
          {isPending && <Loader2 className="ml-1 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        {searchPlaceholder && (
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-10 h-11 sm:h-12 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold text-xs sm:text-sm w-full"
            />
            {isPending && (
              <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-400" />
            )}
          </div>
        )}

        {/* Desktop : Popover déroulant */}
        <div className="hidden lg:block">
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-[min(360px,calc(100vw-1.5rem))] p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 max-h-[70vh] overflow-y-auto overscroll-contain z-50"
            >
              {panelFields}
              <div className="sticky bottom-0 -mx-4 -mb-4 mt-4 px-4 pb-4 pt-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-t border-zinc-100 dark:border-zinc-800">
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
                  {t("filters")}
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1">{panelFields}</div>
              <div className="sticky bottom-0 -mx-5 -mb-5 mt-4 px-5 pb-5 pt-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-t border-zinc-100 dark:border-zinc-800">
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
            className="text-[11px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline underline-offset-2"
          >
            {t("clearAll")}
          </button>
        </div>
      )}
    </div>
  );
}
