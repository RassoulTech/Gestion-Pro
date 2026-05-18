"use client";

import React, { useTransition, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Filter, AlertTriangle, CheckCircle, Ban, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProduitFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("q") || "";
  const currentStatus = searchParams.get("status") || "all";

  const [searchValue, setSearchValue] = useState(currentSearch);

  // Debounce search input
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue) {
        params.set("q", searchValue);
      } else {
        params.delete("q");
      }
      params.set("page", "1"); // Reset pagination

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchValue, pathname, router, searchParams]);

  // Handle status filter change
  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status && status !== "all") {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    params.set("page", "1");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Input Card */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl blur-lg transition-all duration-300 group-focus-within:from-blue-500/10 group-focus-within:to-purple-500/10 pointer-events-none" />
        <div className="relative flex items-center gap-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-2 sm:p-3 rounded-2xl shadow-sm transition-all duration-300 group-focus-within:border-blue-500/30">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
            <Input
              type="text"
              placeholder="Rechercher par nom, code barre ou description..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-12 h-12 rounded-xl bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base text-slate-800 dark:text-zinc-100 placeholder:text-slate-400"
            />
          </div>
          {isPending && (
            <div className="pr-4">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs / Badges */}
      <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mr-2 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" />
          Statut :
        </span>
        
        <Button
          type="button"
          onClick={() => handleStatusChange("all")}
          variant={currentStatus === "all" ? "premium" : "outline"}
          className={cn(
            "h-10 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 gap-1.5",
            currentStatus !== "all" && "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          Tous
        </Button>

        <Button
          type="button"
          onClick={() => handleStatusChange("alert")}
          variant={currentStatus === "alert" ? "default" : "outline"}
          className={cn(
            "h-10 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 gap-1.5",
            currentStatus === "alert" 
              ? "bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20" 
              : "border-slate-200 dark:border-zinc-800 text-rose-500 hover:bg-rose-500/5 hover:border-rose-500/30"
          )}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Stock critique
        </Button>

        <Button
          type="button"
          onClick={() => handleStatusChange("instock")}
          variant={currentStatus === "instock" ? "default" : "outline"}
          className={cn(
            "h-10 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 gap-1.5",
            currentStatus === "instock" 
              ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20" 
              : "border-slate-200 dark:border-zinc-800 text-emerald-600 hover:bg-emerald-500/5 hover:border-emerald-500/30"
          )}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          En stock
        </Button>

        <Button
          type="button"
          onClick={() => handleStatusChange("outofstock")}
          variant={currentStatus === "outofstock" ? "default" : "outline"}
          className={cn(
            "h-10 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 gap-1.5",
            currentStatus === "outofstock" 
              ? "bg-slate-700 text-white hover:bg-slate-800 shadow-lg shadow-slate-700/20" 
              : "border-slate-200 dark:border-zinc-800 text-slate-500 hover:bg-slate-500/5 hover:border-slate-500/30"
          )}
        >
          <Ban className="w-3.5 h-3.5" />
          Rupture
        </Button>
      </div>
    </div>
  );
}
