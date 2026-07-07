"use client";

import React, { useTransition, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  Sparkles,
  Utensils,
  Shirt,
  Laptop,
  Briefcase,
  Layers,
  Store,
  HeartPulse,
  Hammer,
  BookOpen,
  SlidersHorizontal,
  ArrowDownUp,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const SECTEURS = [
  { value: "all", icon: Layers },
  { value: "ALIMENTATION", icon: Utensils },
  { value: "HABILLEMENT", icon: Shirt },
  { value: "ELECTRONIQUE", icon: Laptop },
  { value: "BEAUTE", icon: Sparkles },
  { value: "SANTE", icon: HeartPulse },
  { value: "SERVICES", icon: Briefcase },
  { value: "QUINCAILLERIE", icon: Hammer },
  { value: "LIBRAIRIE", icon: BookOpen },
  { value: "AUTRE", icon: Store },
];

const SORTS = ["recent", "popular", "price_asc", "price_desc"] as const;

interface MarketplaceFiltersProps {
  categories: string[];
  boutiques: { slug: string; nom: string }[];
}

export function MarketplaceFilters({ categories, boutiques }: MarketplaceFiltersProps) {
  const t = useTranslations("marketplace");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") || "";
  const currentSecteur = searchParams.get("secteur") || "all";
  const currentCategorie = searchParams.get("categorie") || "all";
  const currentBoutique = searchParams.get("boutique") || "all";
  const currentDispo = searchParams.get("dispo") || "all";
  const currentSort = searchParams.get("sort") || "recent";

  const [searchValue, setSearchValue] = useState(currentSearch);
  const [prixMin, setPrixMin] = useState(searchParams.get("prixMin") || "");
  const [prixMax, setPrixMax] = useState(searchParams.get("prixMax") || "");
  const [sheetOpen, setSheetOpen] = useState(false);

  // Met à jour l'URL (reset page=1 dès qu'un filtre change)
  const pushParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, pathname, router]
  );

  const setParam = useCallback(
    (key: string, value: string, emptyValue = "all") => {
      pushParams((params) => {
        if (value && value !== emptyValue) params.set(key, value);
        else params.delete(key);
      });
    },
    [pushParams]
  );

  // Recherche débouncée
  useEffect(() => {
    if (searchValue === currentSearch) return;
    const t = setTimeout(() => setParam("search", searchValue, ""), 400);
    return () => clearTimeout(t);
  }, [searchValue, currentSearch, setParam]);

  // Prix débouncé
  useEffect(() => {
    const current = searchParams.get("prixMin") || "";
    if (prixMin === current) return;
    const t = setTimeout(() => setParam("prixMin", prixMin, ""), 500);
    return () => clearTimeout(t);
  }, [prixMin, searchParams, setParam]);

  useEffect(() => {
    const current = searchParams.get("prixMax") || "";
    if (prixMax === current) return;
    const t = setTimeout(() => setParam("prixMax", prixMax, ""), 500);
    return () => clearTimeout(t);
  }, [prixMax, searchParams, setParam]);

  const activeFilterCount = [
    currentCategorie !== "all",
    currentBoutique !== "all",
    currentDispo !== "all",
    !!searchParams.get("prixMin"),
    !!searchParams.get("prixMax"),
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchValue("");
    setPrixMin("");
    setPrixMax("");
    startTransition(() => router.push(pathname));
  };

  // Bloc des filtres avancés réutilisé (desktop + sheet mobile)
  const AdvancedFilters = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Catégorie produit */}
      <Select value={currentCategorie} onValueChange={(v) => setParam("categorie", v)}>
        <SelectTrigger className="h-11 rounded-2xl font-semibold bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <SelectValue placeholder={t("categoryPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allCategories")}</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Boutique */}
      <Select value={currentBoutique} onValueChange={(v) => setParam("boutique", v)}>
        <SelectTrigger className="h-11 rounded-2xl font-semibold bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <SelectValue placeholder={t("boutiquePlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allBoutiques")}</SelectItem>
          {boutiques.map((b) => (
            <SelectItem key={b.slug} value={b.slug}>
              {b.nom}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Disponibilité */}
      <Select value={currentDispo} onValueChange={(v) => setParam("dispo", v)}>
        <SelectTrigger className="h-11 rounded-2xl font-semibold bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <SelectValue placeholder={t("dispoPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allDispo")}</SelectItem>
          <SelectItem value="stock">{t("inStock")}</SelectItem>
          <SelectItem value="rupture">{t("outOfStock")}</SelectItem>
        </SelectContent>
      </Select>

      {/* Prix min / max */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder={t("prixMin")}
          value={prixMin}
          onChange={(e) => setPrixMin(e.target.value)}
          className="h-11 rounded-2xl font-semibold bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
        />
        <span className="text-zinc-400 font-bold">–</span>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder={t("prixMax")}
          value={prixMax}
          onChange={(e) => setPrixMax(e.target.value)}
          className="h-11 rounded-2xl font-semibold bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto">
      {/* Barre de recherche globale */}
      <div className="relative group max-w-2xl mx-auto">
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-[2rem] opacity-20 blur-2xl group-hover:opacity-40 group-focus-within:opacity-40 transition-all duration-700 pointer-events-none" />
        <div className="relative bg-white/70 dark:bg-zinc-900/70 border border-zinc-100 dark:border-zinc-800 p-3 sm:p-4 rounded-[2rem] shadow-2xl backdrop-blur-xl">
          <div className="relative flex items-center">
            <Search className="absolute left-4 sm:left-5 h-5 w-5 sm:h-6 sm:w-6 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-12 sm:h-16 pl-12 sm:pl-14 pr-6 rounded-2xl bg-transparent border-none text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 text-base sm:text-lg font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {isPending && (
              <div className="absolute right-5">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-600"></span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pills secteur (scroll horizontal sur mobile) */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 sm:flex-wrap sm:justify-center sm:mx-0 sm:px-0 sm:overflow-visible scrollbar-none">
        {SECTEURS.map((secteur) => {
          const Icon = secteur.icon;
          const isActive = currentSecteur === secteur.value;
          return (
            <button
              key={secteur.value}
              onClick={() => setParam("secteur", secteur.value)}
              className={cn(
                "h-11 px-4 sm:px-5 py-2 rounded-2xl text-sm font-extrabold flex items-center gap-2 transition-all duration-300 transform active:scale-95 shrink-0",
                isActive
                  ? "bg-brand text-white shadow-xl shadow-brand/20 hover:-translate-y-0.5"
                  : "bg-white/80 dark:bg-zinc-900/80 border border-zinc-100 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:-translate-y-0.5 shadow-sm"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-zinc-400 dark:text-zinc-500")} />
              {t(`secteurs.${secteur.value}`)}
            </button>
          );
        })}
      </div>

      {/* Barre filtres + tri */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Tri (toujours visible) */}
        <div className="flex items-center gap-2 sm:w-auto">
          <Select value={currentSort} onValueChange={(v) => setParam("sort", v, "recent")}>
            <SelectTrigger className="h-11 w-full sm:w-52 rounded-2xl font-bold bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <ArrowDownUp className="h-4 w-4 text-zinc-400 mr-1" />
              <SelectValue placeholder={t("sortPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`sorts.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtres avancés desktop */}
        <div className="hidden lg:block flex-1">{AdvancedFilters}</div>

        {/* Bouton Filtres (mobile/tablette → Sheet) */}
        <div className="lg:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="h-11 w-full rounded-2xl font-bold border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 justify-center"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2 text-zinc-400" />
                {t("filters")}
                {activeFilterCount > 0 && (
                  <span className="ml-2 h-5 min-w-5 px-1.5 rounded-full bg-brand text-white text-[10px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[2rem] max-h-[85vh] overflow-y-auto">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2 font-black">
                  <SlidersHorizontal className="h-5 w-5 text-orange-500" />
                  {t("filterTitle")}
                </SheetTitle>
              </SheetHeader>
              <div className="py-6">{AdvancedFilters}</div>
              <Button
                variant="ghost"
                onClick={resetFilters}
                className="w-full rounded-2xl font-bold text-zinc-500"
              >
                <X className="h-4 w-4 mr-1" />
                {t("resetFilters")}
              </Button>
            </SheetContent>
          </Sheet>
        </div>

        {/* Reset desktop */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            onClick={resetFilters}
            className="hidden lg:flex h-11 rounded-2xl font-bold text-zinc-500 shrink-0"
          >
            <X className="h-4 w-4 mr-1" />
            {t("reset")}
          </Button>
        )}
      </div>
    </div>
  );
}
