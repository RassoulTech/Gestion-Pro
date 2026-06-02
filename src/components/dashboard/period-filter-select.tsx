"use client";

import React, { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
];

export function PeriodFilterSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentRange = searchParams.get("range") || "all";

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set("range", value);
    } else {
      params.delete("range");
    }
    params.delete("from");
    params.delete("to");
    params.delete("page"); // Réinitialiser à la page 1

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <Select value={currentRange} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full sm:w-[200px] h-12 rounded-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-extrabold text-xs text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 focus:ring-brand shrink-0 px-4 min-w-[200px] shadow-sm">
        <div className="flex items-center gap-2 text-left truncate">
          <Calendar className="h-4 w-4 text-orange-500 shrink-0" />
          <SelectValue placeholder="Choisir une période" />
        </div>
      </SelectTrigger>
      <SelectContent className="rounded-2xl border-slate-200/60 dark:border-zinc-800/80 bg-white dark:bg-[#121212] z-50">
        {PERIOD_PRESETS.map((p) => (
          <SelectItem key={p.value} value={p.value} className="font-semibold text-xs rounded-xl focus:bg-orange-500/10 focus:text-orange-500 cursor-pointer">
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
