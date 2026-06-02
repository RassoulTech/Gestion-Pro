"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Check, X, RotateCcw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const PERIOD_PRESETS = [
  { value: "today", label: "Aujourd'hui" },
  { value: "3days", label: "3 derniers jours" },
  { value: "7days", label: "7 derniers jours" },
  { value: "15days", label: "15 derniers jours" },
  { value: "30days", label: "30 derniers jours" },
  { value: "thismonth", label: "Ce mois" },
  { value: "3months", label: "3 derniers mois" },
  { value: "thisyear", label: "Cette année" },
  { value: "all", label: "Toutes les données" },
  { value: "custom", label: "Période personnalisée" },
];

export interface UnifiedFilterPanelProps {
  searchPlaceholder?: string;
  enableSearch?: boolean;

  // Options de filtres
  statusOptions?: { value: string; label: string }[];
  statusLabel?: string;

  categories?: { id: string; nom: string }[];
  categoryLabel?: string;

  suppliers?: { id: string; nom: string }[];
  supplierLabel?: string;

  clients?: { id: string; nom: string; prenom?: string | null }[];
  clientLabel?: string;

  // Mouvements stock
  typeOptions?: { value: string; label: string }[];
  sourceOptions?: string[];
}

export function UnifiedFilterPanel({
  searchPlaceholder = "Rechercher...",
  enableSearch = true,
  statusOptions,
  statusLabel = "Statut",
  categories,
  categoryLabel = "Catégorie",
  suppliers,
  supplierLabel = "Fournisseur",
  clients,
  clientLabel = "Client",
  typeOptions,
  sourceOptions,
}: UnifiedFilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const urlRange = searchParams.get("range") || "";
  const urlFrom = searchParams.get("from") || "";
  const urlTo = searchParams.get("to") || "";
  const urlSearch = searchParams.get("q") || "";
  const urlStatus = searchParams.get("status") || "";
  const urlCategory = searchParams.get("category") || searchParams.get("categoryId") || "";
  const urlSupplier = searchParams.get("supplierId") || "";
  const urlClient = searchParams.get("clientId") || "";
  const urlType = searchParams.get("type") || "";
  const urlSource = searchParams.get("source") || "";

  // États de brouillon pour le panneau de filtres
  const [draftSearch, setDraftSearch] = useState(urlSearch);
  const [draftRange, setDraftRange] = useState(urlRange);
  const [draftFrom, setDraftFrom] = useState(urlFrom);
  const [draftTo, setDraftTo] = useState(urlTo);
  const [draftStatus, setDraftStatus] = useState(urlStatus);
  const [draftCategory, setDraftCategory] = useState(urlCategory);
  const [draftSupplier, setDraftSupplier] = useState(urlSupplier);
  const [draftClient, setDraftClient] = useState(urlClient);
  const [draftType, setDraftType] = useState(urlType);
  const [draftSource, setDraftSource] = useState(urlSource);

  const [mobileOpen, setMobileOpen] = useState(false);

  // Synchronisation des états de brouillon avec l'URL au montage / changement d'URL
  useEffect(() => {
    setDraftSearch(urlSearch);
    setDraftRange(urlRange);
    setDraftFrom(urlFrom);
    setDraftTo(urlTo);
    setDraftStatus(urlStatus);
    setDraftCategory(urlCategory);
    setDraftSupplier(urlSupplier);
    setDraftClient(urlClient);
    setDraftType(urlType);
    setDraftSource(urlSource);
  }, [
    urlSearch,
    urlRange,
    urlFrom,
    urlTo,
    urlStatus,
    urlCategory,
    urlSupplier,
    urlClient,
    urlType,
    urlSource,
  ]);

  // Compter le nombre de filtres actifs pour afficher un indicateur visuel
  const activeCount = React.useMemo(() => {
    let count = 0;
    if (urlSearch) count++;
    if (urlRange && urlRange !== "all") count++;
    if (urlStatus && urlStatus !== "ALL" && urlStatus !== "all") count++;
    if (urlCategory && urlCategory !== "ALL" && urlCategory !== "all") count++;
    if (urlSupplier) count++;
    if (urlClient) count++;
    if (urlType && urlType !== "ALL") count++;
    if (urlSource && urlSource !== "ALL") count++;
    return count;
  }, [
    urlSearch,
    urlRange,
    urlStatus,
    urlCategory,
    urlSupplier,
    urlClient,
    urlType,
    urlSource,
  ]);

  const handleApply = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Recherche
    if (draftSearch) params.set("q", draftSearch);
    else params.delete("q");

    // Période
    if (draftRange && draftRange !== "all") {
      params.set("range", draftRange);
      if (draftRange === "custom") {
        if (draftFrom) params.set("from", draftFrom);
        if (draftTo) params.set("to", draftTo);
      } else {
        params.delete("from");
        params.delete("to");
      }
    } else {
      params.delete("range");
      params.delete("from");
      params.delete("to");
    }

    // Statut
    if (draftStatus && draftStatus !== "all" && draftStatus !== "ALL") {
      params.set("status", draftStatus);
    } else {
      params.delete("status");
    }

    // Catégorie (supporte les deux clés paramétriques existantes category / categoryId)
    if (draftCategory && draftCategory !== "all" && draftCategory !== "ALL") {
      if (searchParams.has("categoryId")) {
        params.set("categoryId", draftCategory);
      } else {
        params.set("category", draftCategory);
      }
    } else {
      params.delete("category");
      params.delete("categoryId");
    }

    // Fournisseur
    if (draftSupplier) {
      params.set("supplierId", draftSupplier);
    } else {
      params.delete("supplierId");
    }

    // Client
    if (draftClient) {
      params.set("clientId", draftClient);
    } else {
      params.delete("clientId");
    }

    // Mouvements Stock Type
    if (draftType && draftType !== "ALL") {
      params.set("type", draftType);
    } else {
      params.delete("type");
    }

    // Mouvements Stock Source
    if (draftSource && draftSource !== "ALL") {
      params.set("source", draftSource);
    } else {
      params.delete("source");
    }

    params.delete("page"); // Réinitialiser à la page 1

    setMobileOpen(false);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [
    searchParams,
    draftSearch,
    draftRange,
    draftFrom,
    draftTo,
    draftStatus,
    draftCategory,
    draftSupplier,
    draftClient,
    draftType,
    draftSource,
    pathname,
    router,
  ]);

  const handleReset = useCallback(() => {
    const params = new URLSearchParams();
    // Conserver uniquement l'identifiant de la boutique dans les routes si nécessaire
    // (toutes les routes d'action Next.js conservent la boutique via le segment d'URL principal)
    
    setDraftSearch("");
    setDraftRange("all");
    setDraftFrom("");
    setDraftTo("");
    setDraftStatus("");
    setDraftCategory("");
    setDraftSupplier("");
    setDraftClient("");
    setDraftType("");
    setDraftSource("");

    setMobileOpen(false);
    startTransition(() => {
      router.push(pathname);
    });
  }, [pathname, router]);

  // Contenu interne du formulaire de filtres (Scrollable)
  const filtersFormContent = (
    <div className="space-y-6 pr-1">
      {/* 1. Recherche */}
      {enableSearch && (
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Recherche
          </Label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-slate-100 dark:border-zinc-800 font-bold text-xs"
            />
          </div>
        </div>
      )}

      {/* 2. Période */}
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Période
        </Label>
        <div className="grid grid-cols-1 gap-1">
          {PERIOD_PRESETS.map((p) => {
            const active = draftRange === p.value || (!draftRange && p.value === "all");
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setDraftRange(p.value)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-between border transition-all active:scale-95",
                  active
                    ? "bg-orange-500 text-white border-transparent shadow-sm"
                    : "bg-slate-50 dark:bg-zinc-800/40 border-slate-100 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80"
                )}
              >
                <span>{p.label}</span>
                {active && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>

        {/* Champs de période personnalisée */}
        {draftRange === "custom" && (
          <div className="grid grid-cols-2 gap-2 pt-2 animate-in slide-in-from-top-1 duration-200">
            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-slate-400 dark:text-zinc-500">Début</Label>
              <Input
                type="date"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
                className="h-9 rounded-xl border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 font-bold text-xs px-2"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-slate-400 dark:text-zinc-500">Fin</Label>
              <Input
                type="date"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
                className="h-9 rounded-xl border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 font-bold text-xs px-2"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Statut */}
      {statusOptions && (
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            {statusLabel}
          </Label>
          <div className="grid grid-cols-1 gap-1">
            <button
              type="button"
              onClick={() => setDraftStatus("")}
              className={cn(
                "w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-between border transition-all active:scale-95",
                !draftStatus
                  ? "bg-orange-500 text-white border-transparent shadow-sm"
                  : "bg-slate-50 dark:bg-zinc-800/40 border-slate-100 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80"
              )}
            >
              <span>Tous</span>
              {!draftStatus && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
            {statusOptions.map((opt) => {
              const active = draftStatus === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDraftStatus(opt.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-between border transition-all active:scale-95",
                    active
                      ? "bg-orange-500 text-white border-transparent shadow-sm"
                      : "bg-slate-50 dark:bg-zinc-800/40 border-slate-100 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80"
                  )}
                >
                  <span>{opt.label}</span>
                  {active && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Catégorie */}
      {categories && (
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            {categoryLabel}
          </Label>
          <div className="max-h-40 overflow-y-auto pr-1 space-y-1 border border-slate-100 dark:border-zinc-800 rounded-xl p-2 bg-slate-50/50 dark:bg-zinc-900/20">
            <button
              type="button"
              onClick={() => setDraftCategory("")}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded-lg text-xs font-extrabold flex items-center justify-between transition-colors",
                !draftCategory
                  ? "bg-orange-500/10 text-orange-500 dark:text-orange-400"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              )}
            >
              <span>Toutes les catégories</span>
              {!draftCategory && <Check className="w-3 h-3" />}
            </button>
            {categories.map((c) => {
              const active = draftCategory === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setDraftCategory(c.id)}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded-lg text-xs font-extrabold flex items-center justify-between transition-colors",
                    active
                      ? "bg-orange-500/10 text-orange-500 dark:text-orange-400"
                      : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  )}
                >
                  <span className="truncate">{c.nom}</span>
                  {active && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Fournisseur */}
      {suppliers && (
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            {supplierLabel}
          </Label>
          <div className="max-h-40 overflow-y-auto pr-1 space-y-1 border border-slate-100 dark:border-zinc-800 rounded-xl p-2 bg-slate-50/50 dark:bg-zinc-900/20">
            <button
              type="button"
              onClick={() => setDraftSupplier("")}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded-lg text-xs font-extrabold flex items-center justify-between transition-colors",
                !draftSupplier
                  ? "bg-orange-500/10 text-orange-500 dark:text-orange-400"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              )}
            >
              <span>Tous les fournisseurs</span>
              {!draftSupplier && <Check className="w-3 h-3" />}
            </button>
            {suppliers.map((s) => {
              const active = draftSupplier === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setDraftSupplier(s.id)}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded-lg text-xs font-extrabold flex items-center justify-between transition-colors",
                    active
                      ? "bg-orange-500/10 text-orange-500 dark:text-orange-400"
                      : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  )}
                >
                  <span className="truncate">{s.nom}</span>
                  {active && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Client */}
      {clients && (
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            {clientLabel}
          </Label>
          <div className="max-h-40 overflow-y-auto pr-1 space-y-1 border border-slate-100 dark:border-zinc-800 rounded-xl p-2 bg-slate-50/50 dark:bg-zinc-900/20">
            <button
              type="button"
              onClick={() => setDraftClient("")}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded-lg text-xs font-extrabold flex items-center justify-between transition-colors",
                !draftClient
                  ? "bg-orange-500/10 text-orange-500 dark:text-orange-400"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              )}
            >
              <span>Tous les clients</span>
              {!draftClient && <Check className="w-3 h-3" />}
            </button>
            {clients.map((c) => {
              const active = draftClient === c.id;
              const fullName = `${c.prenom || ""} ${c.nom}`.trim() || "Client sans nom";
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setDraftClient(c.id)}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded-lg text-xs font-extrabold flex items-center justify-between transition-colors",
                    active
                      ? "bg-orange-500/10 text-orange-500 dark:text-orange-400"
                      : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  )}
                >
                  <span className="truncate">{fullName}</span>
                  {active && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Mouvements Stock Type */}
      {typeOptions && (
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Type de mouvement
          </Label>
          <div className="grid grid-cols-1 gap-1">
            {typeOptions.map((opt) => {
              const active = draftType === opt.value || (!draftType && opt.value === "ALL");
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDraftType(opt.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-between border transition-all active:scale-95",
                    active
                      ? "bg-orange-500 text-white border-transparent shadow-sm"
                      : "bg-slate-50 dark:bg-zinc-800/40 border-slate-100 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80"
                  )}
                >
                  <span>{opt.label}</span>
                  {active && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. Mouvements Stock Source */}
      {sourceOptions && (
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Source de mouvement
          </Label>
          <div className="max-h-40 overflow-y-auto pr-1 space-y-1 border border-slate-100 dark:border-zinc-800 rounded-xl p-2 bg-slate-50/50 dark:bg-zinc-900/20">
            <button
              type="button"
              onClick={() => setDraftSource("")}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded-lg text-xs font-extrabold flex items-center justify-between transition-colors",
                !draftSource || draftSource === "ALL"
                  ? "bg-orange-500/10 text-orange-500 dark:text-orange-400"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              )}
            >
              <span>Toutes les sources</span>
              {(!draftSource || draftSource === "ALL") && <Check className="w-3 h-3" />}
            </button>
            {sourceOptions.map((s) => {
              const active = draftSource === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDraftSource(s)}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded-lg text-xs font-extrabold flex items-center justify-between transition-colors",
                    active
                      ? "bg-orange-500/10 text-orange-500 dark:text-orange-400"
                      : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  )}
                >
                  <span className="truncate">{s}</span>
                  {active && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // Boutons du bas (Appliquer & Réinitialiser)
  const filtersButtons = (
    <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm sticky bottom-0">
      <Button
        type="button"
        variant="outline"
        onClick={handleReset}
        className="flex-1 h-10 rounded-xl font-bold border-slate-200 dark:border-zinc-800 text-xs gap-1.5"
      >
        <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
        Réinitialiser
      </Button>
      <Button
        type="button"
        onClick={handleApply}
        className="flex-1 h-10 rounded-xl font-extrabold bg-orange-500 text-white hover:bg-orange-650 text-xs gap-1.5 shadow-md shadow-orange-500/10"
      >
        <Check className="h-3.5 w-3.5" />
        Appliquer
      </Button>
    </div>
  );

  return (
    <>
      {/* ================= DESKTOP VIEW : persistent left sidebar ================= */}
      <div className="hidden lg:flex flex-col bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-[2rem] p-5 shadow-sm max-h-[70vh] overflow-y-auto sticky top-24 w-72 shrink-0 scrollbar-thin select-none">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-orange-500" />
            Filtres
          </span>
          {activeCount > 0 && (
            <span className="h-5 min-w-5 px-1.5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center animate-in scale-in duration-200">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex-1 pb-4">{filtersFormContent}</div>
        {filtersButtons}
      </div>

      {/* ================= MOBILE VIEW : floating Sheet / sliding drawer ================= */}
      <div className="lg:hidden flex items-center justify-between gap-3 w-full bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-3 rounded-2xl shadow-sm">
        {enableSearch ? (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              className="pl-8 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-none font-bold text-xs"
            />
          </div>
        ) : (
          <div className="flex-1 text-xs font-black text-slate-400 uppercase tracking-widest pl-2">
            Filtres du panneau
          </div>
        )}

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 font-extrabold gap-2 shrink-0 text-xs shadow-sm hover:bg-slate-50"
            >
              <SlidersHorizontal className="h-4 w-4 text-orange-500" />
              Filtres
              {activeCount > 0 && (
                <span className="h-5 min-w-5 px-1.5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-full sm:max-w-sm rounded-l-[1.75rem] h-full p-5 flex flex-col justify-between overflow-y-auto z-50 bg-white dark:bg-zinc-900"
          >
            <SheetHeader className="text-left pb-2 border-b border-slate-100 dark:border-zinc-800">
              <SheetTitle className="flex items-center gap-2 font-black text-slate-800 dark:text-zinc-100">
                <SlidersHorizontal className="h-5 w-5 text-orange-500" />
                Panneau de Filtres
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 py-4 overflow-y-auto scrollbar-none pr-1">
              {filtersFormContent}
            </div>
            {filtersButtons}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
