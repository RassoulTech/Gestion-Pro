"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  const urlStatus = searchParams.get("status") || "all";
  const urlCategory = searchParams.get("category") || searchParams.get("categoryId") || "all";
  const urlSupplier = searchParams.get("supplierId") || "all";
  const urlClient = searchParams.get("clientId") || "all";
  const urlType = searchParams.get("type") || "ALL";
  const urlSource = searchParams.get("source") || "ALL";

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

  // Toggle mobile-first pour afficher/masquer les filtres avancés sur mobile
  const [expanded, setExpanded] = useState(false);

  // Synchronisation des états de brouillon avec l'URL
  useEffect(() => {
    setDraftSearch(urlSearch);
    setDraftRange(urlRange || "all");
    setDraftFrom(urlFrom);
    setDraftTo(urlTo);
    setDraftStatus(urlStatus || "all");
    setDraftCategory(urlCategory || "all");
    setDraftSupplier(urlSupplier || "all");
    setDraftClient(urlClient || "all");
    setDraftType(urlType || "ALL");
    setDraftSource(urlSource || "ALL");
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
    if (urlSupplier && urlSupplier !== "all") count++;
    if (urlClient && urlClient !== "all") count++;
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
    if (draftSupplier && draftSupplier !== "all") {
      params.set("supplierId", draftSupplier);
    } else {
      params.delete("supplierId");
    }

    // Client
    if (draftClient && draftClient !== "all") {
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
    setDraftStatus("all");
    setDraftCategory("all");
    setDraftSupplier("all");
    setDraftClient("all");
    setDraftType("ALL");
    setDraftSource("ALL");

    startTransition(() => {
      router.push(pathname);
    });
  }, [pathname, router]);

  // Déterminer s'il y a des filtres avancés activables
  const hasAdvancedFilters =
    statusOptions || categories || suppliers || clients || typeOptions || sourceOptions || true;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-[2rem] p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-5 w-full select-none transition-all duration-300">
      {/* En-tête de filtre mobile-first */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="w-4.5 h-4.5 text-orange-500" />
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
            Filtres
          </h2>
          {activeCount > 0 && (
            <span className="h-5 min-w-5 px-1.5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center animate-in scale-in duration-200">
              {activeCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <Button
              variant="ghost"
              onClick={handleReset}
              className="h-8 px-2.5 rounded-xl font-bold text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs gap-1.5 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Réinitialiser</span>
            </Button>
          )}

          {/* Bouton mobile de masquage/affichage */}
          <Button
            variant="outline"
            onClick={() => setExpanded(!expanded)}
            className="h-8 px-3 rounded-xl border-slate-200 dark:border-zinc-800 text-[10px] sm:text-xs font-extrabold flex md:hidden items-center gap-1.5"
          >
            {expanded ? "Masquer" : "Afficher"}
          </Button>
        </div>
      </div>

      {/* Barre de Recherche Principale (Toujours visible pour un accès mobile-first rapide) */}
      {enableSearch && (
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl blur-lg opacity-40 group-focus-within:opacity-80 transition-all duration-300" />
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              className="pl-9 h-11 rounded-xl bg-slate-50/50 dark:bg-zinc-850/50 border-slate-100 dark:border-zinc-800 font-bold text-xs focus-visible:ring-orange-500 focus-visible:ring-offset-0"
            />
          </div>
        </div>
      )}

      {/* Zone des filtres avancés (Toujours visible sur tablette/desktop, pliable sur mobile) */}
      <div
        className={cn(
          "md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 transition-all duration-300 ease-in-out",
          expanded ? "flex flex-col opacity-100" : "hidden md:grid"
        )}
      >
        {/* 1. Période */}
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Période
          </Label>
          <Select value={draftRange} onValueChange={setDraftRange}>
            <SelectTrigger className="h-11 rounded-xl font-bold bg-slate-50/50 dark:bg-zinc-850/50 border-slate-100 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 focus:ring-orange-500">
              <SelectValue placeholder="Choisir une période" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value} className="font-semibold text-xs">
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Picker Custom si range === "custom" */}
          {draftRange === "custom" && (
            <div className="grid grid-cols-2 gap-2 pt-1.5 animate-in slide-in-from-top-1 duration-200">
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-slate-400 dark:text-zinc-500">Début</Label>
                <Input
                  type="date"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className="h-9 rounded-xl border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-850/50 font-bold text-xs px-2 focus-visible:ring-orange-500"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-slate-400 dark:text-zinc-500">Fin</Label>
                <Input
                  type="date"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="h-9 rounded-xl border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-850/50 font-bold text-xs px-2 focus-visible:ring-orange-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* 2. Statut */}
        {statusOptions && (
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              {statusLabel}
            </Label>
            <Select value={draftStatus} onValueChange={setDraftStatus}>
              <SelectTrigger className="h-11 rounded-xl font-bold bg-slate-50/50 dark:bg-zinc-850/50 border-slate-100 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 focus:ring-orange-500">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-semibold text-xs">Tous</SelectItem>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="font-semibold text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 3. Catégorie */}
        {categories && (
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              {categoryLabel}
            </Label>
            <Select value={draftCategory} onValueChange={setDraftCategory}>
              <SelectTrigger className="h-11 rounded-xl font-bold bg-slate-50/50 dark:bg-zinc-850/50 border-slate-100 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 focus:ring-orange-500">
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-semibold text-xs">Toutes les catégories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="font-semibold text-xs">
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 4. Fournisseur */}
        {suppliers && (
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              {supplierLabel}
            </Label>
            <Select value={draftSupplier} onValueChange={setDraftSupplier}>
              <SelectTrigger className="h-11 rounded-xl font-bold bg-slate-50/50 dark:bg-zinc-850/50 border-slate-100 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 focus:ring-orange-500">
                <SelectValue placeholder="Tous les fournisseurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-semibold text-xs">Tous les fournisseurs</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="font-semibold text-xs">
                    {s.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 5. Client */}
        {clients && (
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              {clientLabel}
            </Label>
            <Select value={draftClient} onValueChange={setDraftClient}>
              <SelectTrigger className="h-11 rounded-xl font-bold bg-slate-50/50 dark:bg-zinc-850/50 border-slate-100 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 focus:ring-orange-500">
                <SelectValue placeholder="Tous les clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-semibold text-xs">Tous les clients</SelectItem>
                {clients.map((c) => {
                  const fullName = `${c.prenom || ""} ${c.nom}`.trim() || "Client sans nom";
                  return (
                    <SelectItem key={c.id} value={c.id} className="font-semibold text-xs">
                      {fullName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 6. Type Mouvement Stock */}
        {typeOptions && (
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Type de mouvement
            </Label>
            <Select value={draftType} onValueChange={setDraftType}>
              <SelectTrigger className="h-11 rounded-xl font-bold bg-slate-50/50 dark:bg-zinc-850/50 border-slate-100 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 focus:ring-orange-500">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="font-semibold text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 7. Source Mouvement Stock */}
        {sourceOptions && (
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Source de mouvement
            </Label>
            <Select value={draftSource} onValueChange={setDraftSource}>
              <SelectTrigger className="h-11 rounded-xl font-bold bg-slate-50/50 dark:bg-zinc-850/50 border-slate-100 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 focus:ring-orange-500">
                <SelectValue placeholder="Toutes les sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="font-semibold text-xs">Toutes les sources</SelectItem>
                {sourceOptions.map((s) => (
                  <SelectItem key={s} value={s} className="font-semibold text-xs">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Barre d'action inférieure : Appliquer les filtres (Mobile-first : full-width sur mobile) */}
      <div
        className={cn(
          "flex justify-end pt-4 border-t border-slate-100 dark:border-zinc-800/80 transition-all duration-300",
          expanded ? "flex" : "hidden md:flex"
        )}
      >
        <Button
          type="button"
          onClick={handleApply}
          className="h-11 w-full sm:w-auto px-6 rounded-xl font-extrabold bg-orange-500 text-white hover:bg-orange-600 text-xs gap-1.5 shadow-md shadow-orange-500/10 transition-all duration-300 transform active:scale-95 shrink-0"
        >
          <Check className="h-4 w-4" />
          Appliquer les filtres
        </Button>
      </div>
    </div>
  );
}
