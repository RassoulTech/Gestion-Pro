"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Calendar, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const PERIOD_PRESETS = [
  { value: "30days", label: "30 derniers jours (Défaut)" },
  { value: "today", label: "Aujourd'hui" },
  { value: "yesterday", label: "Hier" },
  { value: "3days", label: "3 derniers jours" },
  { value: "7days", label: "7 derniers jours" },
  { value: "15days", label: "15 derniers jours" },
  { value: "thismonth", label: "Ce mois" },
  { value: "lastmonth", label: "Mois précédent" },
  { value: "3months", label: "3 derniers mois" },
  { value: "6months", label: "6 derniers mois" },
  { value: "thisyear", label: "Cette année" },
  { value: "all", label: "Toutes les données" },
  { value: "custom", label: "Période personnalisée" },
];

export function PeriodFilterSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Get active range from URL, defaulting to 30days
  const urlRange = searchParams.get("range") || "30days";
  const urlFrom = searchParams.get("from") || "";
  const urlTo = searchParams.get("to") || "";

  // Local state to keep UI select value responsive
  const [selectedRange, setSelectedRange] = useState(urlRange);
  // Local state for custom dates before submission
  const [tempFrom, setTempFrom] = useState(urlFrom);
  const [tempTo, setTempTo] = useState(urlTo);

  // Sync state with URL when search params change (e.g. on reset or external URL update)
  useEffect(() => {
    setSelectedRange(urlRange);
    setTempFrom(urlFrom);
    setTempTo(urlTo);
  }, [urlRange, urlFrom, urlTo]);

  const handlePresetChange = (value: string) => {
    setSelectedRange(value);
    
    if (value !== "custom") {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "30days") {
        params.set("range", value);
      } else {
        params.delete("range"); // Deleting range defaults to 30days on the server-side parseDateFilter
      }
      params.delete("from");
      params.delete("to");
      params.delete("page"); // Reset pagination index

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }
  };

  const handleApplyCustom = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", "custom");
    if (tempFrom) {
      params.set("from", tempFrom);
    } else {
      params.delete("from");
    }
    if (tempTo) {
      params.set("to", tempTo);
    } else {
      params.delete("to");
    }
    params.delete("page"); // Reset pagination index

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
      <Select value={selectedRange} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-full sm:w-[220px] h-12 rounded-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-extrabold text-xs text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 focus:ring-brand shrink-0 px-4 min-w-[220px] shadow-sm transition-colors duration-250">
          <div className="flex items-center gap-2 text-left truncate">
            <Calendar className="h-4 w-4 text-orange-500 shrink-0" />
            <SelectValue placeholder="Choisir une période" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-slate-200/60 dark:border-zinc-800/80 bg-white dark:bg-[#121212] z-50 shadow-xl max-h-[300px]">
          {PERIOD_PRESETS.map((p) => (
            <SelectItem 
              key={p.value} 
              value={p.value} 
              className="font-semibold text-xs rounded-xl focus:bg-orange-500/10 focus:text-orange-500 cursor-pointer"
            >
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedRange === "custom" && (
        <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in slide-in-from-left-3 duration-250">
          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 h-12 w-full sm:w-auto shadow-sm">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 shrink-0">Du</span>
            <input
              type="date"
              value={tempFrom}
              onChange={(e) => setTempFrom(e.target.value)}
              className="bg-transparent font-extrabold text-xs outline-none text-slate-800 dark:text-zinc-200 w-full sm:w-auto min-w-[105px] border-none p-0 focus:ring-0"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 h-12 w-full sm:w-auto shadow-sm">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 shrink-0">Au</span>
            <input
              type="date"
              value={tempTo}
              onChange={(e) => setTempTo(e.target.value)}
              className="bg-transparent font-extrabold text-xs outline-none text-slate-800 dark:text-zinc-200 w-full sm:w-auto min-w-[105px] border-none p-0 focus:ring-0"
            />
          </div>
          <Button
            onClick={handleApplyCustom}
            size="icon"
            className="h-12 w-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-md shrink-0 active:scale-95 transition-all duration-200"
          >
            <Check className="h-4.5 w-4.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
