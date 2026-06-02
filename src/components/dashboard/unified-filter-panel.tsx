"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PERIOD_PRESETS = [
  { value: "all", label: "Toutes les données" },
  { value: "today", label: "Aujourd'hui" },
  { value: "3days", label: "3 derniers jours" },
  { value: "7days", label: "7 derniers jours" },
  { value: "15days", label: "15 derniers jours" },
  { value: "30days", label: "30 derniers jours" },
  { value: "thismonth", label: "Ce mois" },
  { value: "3months", label: "3 derniers mois" },
  { value: "thisyear", label: "Cette année" },
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

  const urlRange = searchParams.get("range") || "all";
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

  // Synchronisation des états de brouillon avec l'URL
  useEffect(() => {
    setDraftSearch(urlSearch);
    setDraftRange(urlRange || "all");
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

  // Compter le nombre de filtres actifs
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

    // Catégorie
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

    startTransition(() => {
      router.push(pathname);
    });
  }, [pathname, router]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-sm space-y-6 w-full select-none">
      {/* En-tête : Titre & Badge & Bouton de réinitialisation */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="w-5 h-5 text-orange-500" />
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
            Filtres
          </h2>
          {activeCount > 0 && (
            <span className="h-5 min-w-5 px-1.5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center animate-in scale-in duration-200">
              {activeCount}
            </span>
          )}
        </div>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="h-8 px-3 rounded-xl font-bold text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs gap-1.5 transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Grille Responsive des options de filtrage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
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
                className="pl-9 h-11 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-slate-100 dark:border-zinc-800 font-bold text-xs focus-visible:ring-orange-500"
              />
            </div>
          </div>
        )}

        {/* 2. Période */}
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Période
          </Label>
          <div className="relative">
            <select
              value={draftRange}
              onChange={(e) => setDraftRange(e.target.value)}
              className="w-full h-11 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 px-3 font-bold text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500 appearance-none"
            >
              {PERIOD_PRESETS.map((p) => (
                <option key={p.value} value={p.value} className="font-semibold text-xs">
                  {p.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>

          {/* Date Picker Custom si range === "custom" */}
          {draftRange === "custom" && (
            <div className="grid grid-cols-2 gap-2 pt-2 animate-in slide-in-from-top-1 duration-200">
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-slate-400 dark:text-zinc-500">Début</Label>
                <Input
                  type="date"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className="h-9 rounded-xl border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 font-bold text-xs px-2 focus-visible:ring-orange-500"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-slate-400 dark:text-zinc-500">Fin</Label>
                <Input
                  type="date"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="h-9 rounded-xl border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 font-bold text-xs px-2 focus-visible:ring-orange-500"
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
            <div className="relative">
              <select
                value={draftStatus || "all"}
                onChange={(e) => setDraftStatus(e.target.value === "all" ? "" : e.target.value)}
                className="w-full h-11 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 px-3 font-bold text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500 appearance-none"
              >
                <option value="all" className="font-semibold text-xs">Tous</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="font-semibold text-xs">
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* 4. Catégorie */}
        {categories && (
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              {categoryLabel}
            </Label>
            <div className="relative">
              <select
                value={draftCategory || "all"}
                onChange={(e) => setDraftCategory(e.target.value === "all" ? "" : e.target.value)}
                className="w-full h-11 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 px-3 font-bold text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500 appearance-none"
              >
                <option value="all" className="font-semibold text-xs">Toutes les catégories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="font-semibold text-xs">
                    {c.nom}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* 5. Fournisseur */}
        {suppliers && (
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              {supplierLabel}
            </Label>
            <div className="relative">
              <select
                value={draftSupplier || "all"}
                onChange={(e) => setDraftSupplier(e.target.value === "all" ? "" : e.target.value)}
                className="w-full h-11 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 px-3 font-bold text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500 appearance-none"
              >
                <option value="all" className="font-semibold text-xs">Tous les fournisseurs</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id} className="font-semibold text-xs">
                    {s.nom}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* 6. Client */}
        {clients && (
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              {clientLabel}
            </Label>
            <div className="relative">
              <select
                value={draftClient || "all"}
                onChange={(e) => setDraftClient(e.target.value === "all" ? "" : e.target.value)}
                className="w-full h-11 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 px-3 font-bold text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500 appearance-none"
              >
                <option value="all" className="font-semibold text-xs">Tous les clients</option>
                {clients.map((c) => {
                  const fullName = `${c.prenom || ""} ${c.nom}`.trim() || "Client sans nom";
                  return (
                    <option key={c.id} value={c.id} className="font-semibold text-xs">
                      {fullName}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* 7. Type Mouvement Stock */}
        {typeOptions && (
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Type de mouvement
            </Label>
            <div className="relative">
              <select
                value={draftType || "ALL"}
                onChange={(e) => setDraftType(e.target.value)}
                className="w-full h-11 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 px-3 font-bold text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500 appearance-none"
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="font-semibold text-xs">
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* 8. Source Mouvement Stock */}
        {sourceOptions && (
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Source de mouvement
            </Label>
            <div className="relative">
              <select
                value={draftSource || "ALL"}
                onChange={(e) => setDraftSource(e.target.value)}
                className="w-full h-11 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 px-3 font-bold text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500 appearance-none"
              >
                <option value="ALL" className="font-semibold text-xs">Toutes les sources</option>
                {sourceOptions.map((s) => (
                  <option key={s} value={s} className="font-semibold text-xs">
                    {s}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bouton d'application de filtres */}
      <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-zinc-800/80">
        <Button
          type="button"
          onClick={handleApply}
          className="h-11 px-6 rounded-xl font-extrabold bg-orange-500 text-white hover:bg-orange-600 text-xs gap-1.5 shadow-md shadow-orange-500/10 transition-all duration-300 transform active:scale-95 shrink-0"
        >
          <Check className="h-4 w-4" />
          Appliquer les filtres
        </Button>
      </div>
    </div>
  );
}
