"use client";

import React, { useTransition, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { 
  Search, 
  Sparkles, 
  Utensils, 
  Shirt, 
  Laptop, 
  Briefcase, 
  Layers, 
  Store 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SECTEURS = [
  { label: "Tous", value: "all", icon: Layers },
  { label: "Alimentation", value: "Alimentation", icon: Utensils },
  { label: "Beauté", value: "Beauté", icon: Sparkles },
  { label: "Prêt-à-porter", value: "Prêt-à-porter", icon: Shirt },
  { label: "Technologies", value: "Technologies", icon: Laptop },
  { label: "Services", value: "Services", icon: Briefcase },
  { label: "Autre", value: "Autre", icon: Store }
];

export function MarketplaceFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") || "";
  const currentSecteur = searchParams.get("secteur") || "all";

  const [searchValue, setSearchValue] = useState(currentSearch);

  // Debounce search bar
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue) {
        params.set("search", searchValue);
      } else {
        params.delete("search");
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchValue, pathname, router, searchParams]);

  // Handle category / sector click
  const handleSecteurClick = (secteur: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (secteur && secteur !== "all") {
      params.set("secteur", secteur);
    } else {
      params.delete("secteur");
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-10 w-full max-w-5xl mx-auto">
      
      {/* Premium Glassmorphism Search Card */}
      <div className="relative group max-w-2xl mx-auto">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[2rem] opacity-20 blur-2xl group-hover:opacity-40 group-focus-within:opacity-40 transition-all duration-700 pointer-events-none" />
        <div className="relative bg-white/70 dark:bg-zinc-900/70 border border-slate-100 dark:border-zinc-800 p-4 rounded-[2rem] shadow-2xl backdrop-blur-xl transition-all duration-300">
          <div className="relative flex items-center">
            <Search className="absolute left-5 h-6 w-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              type="text"
              placeholder="Rechercher un commerce par nom..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-16 pl-14 pr-6 rounded-2xl bg-transparent border-none text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 text-lg font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {isPending && (
              <div className="absolute right-5">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {SECTEURS.map((secteur) => {
          const Icon = secteur.icon;
          const isActive = currentSecteur === secteur.value;

          return (
            <button
              key={secteur.value}
              onClick={() => handleSecteurClick(secteur.value)}
              className={cn(
                "h-12 px-5 py-2.5 rounded-2xl text-sm font-extrabold flex items-center gap-2.5 transition-all duration-300 transform active:scale-95",
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/20 hover:-translate-y-0.5"
                  : "bg-white/80 dark:bg-zinc-900/80 border border-slate-100 dark:border-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:-translate-y-0.5 shadow-sm"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400 dark:text-zinc-500")} />
              {secteur.label}
            </button>
          );
        })}
      </div>

    </div>
  );
}
