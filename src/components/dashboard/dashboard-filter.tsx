"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Calendar, ChevronDown, Check, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const rangeOptions = [
  { value: "today", label: "Aujourd'hui" },
  { value: "yesterday", label: "Hier" },
  { value: "3days", label: "3 derniers jours" },
  { value: "7days", label: "7 derniers jours" },
  { value: "15days", label: "15 derniers jours" },
  { value: "30days", label: "30 derniers jours" },
  { value: "thismonth", label: "Ce mois" },
  { value: "lastmonth", label: "Mois précédent" },
  { value: "3months", label: "3 derniers mois" },
  { value: "6months", label: "6 derniers mois" },
  { value: "thisyear", label: "Cette année" },
  { value: "all", label: "Toutes les données" },
  { value: "custom", label: "Période personnalisée" },
];

export function DashboardFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rangeParam = searchParams.get("range") || "30days";
  const fromParam = searchParams.get("from") || "";
  const toParam = searchParams.get("to") || "";

  const [open, setOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState(rangeParam);
  const [fromDate, setFromDate] = useState(fromParam);
  const [toDate, setToDate] = useState(toParam);

  // Sync state with URL when search params change
  useEffect(() => {
    setSelectedRange(rangeParam);
    setFromDate(fromParam);
    setToDate(toParam);
  }, [rangeParam, fromParam, toParam]);

  const activeLabel =
    rangeOptions.find((opt) => opt.value === selectedRange)?.label ||
    "30 derniers jours";

  const handleSelectRange = (val: string) => {
    if (val === "custom") {
      setSelectedRange("custom");
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("range", val);
    params.delete("from");
    params.delete("to");
    params.delete("page"); // Reset page on filter change
    
    setOpen(false);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleApplyCustomFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("range", "custom");
    params.set("from", fromDate);
    params.set("to", toDate);
    params.delete("page"); // Reset page on filter change

    setOpen(false);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-11 sm:h-12 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-extrabold shadow-sm gap-2 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-xs sm:text-sm shrink-0"
        >
          <Calendar className="h-4.5 w-4.5 text-orange-500 shrink-0" />
          <span className="truncate max-w-[150px] sm:max-w-none">
            {selectedRange === "custom" && fromDate && toDate
              ? `Du ${fromDate.split("-").reverse().join("/")} au ${toDate.split("-").reverse().join("/")}`
              : activeLabel}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400 dark:text-zinc-500 shrink-0 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 sm:w-80 p-2 rounded-2xl border-none shadow-2xl bg-white dark:bg-zinc-900 mx-4 sm:mx-0 z-50 overflow-y-auto max-h-[85vh] sm:max-h-none scrollbar-thin"
        align="end"
      >
        <div className="space-y-1.5 pb-2">
          <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-orange-500" />
              Filtrer la période
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-0.5">
          {rangeOptions.map((opt) => {
            const isSelected = selectedRange === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleSelectRange(opt.value)}
                className={cn(
                  "w-full px-3 py-2.5 rounded-lg text-left text-xs sm:text-sm font-bold flex items-center justify-between transition-colors",
                  isSelected
                    ? "bg-orange-500 text-white"
                    : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                )}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-white" />}
              </button>
            );
          })}
        </div>

        {selectedRange === "custom" && (
          <form
            onSubmit={handleApplyCustomFilter}
            className="p-3 border-t border-slate-100 dark:border-zinc-800 mt-2 space-y-3 bg-slate-50/50 dark:bg-zinc-800/20 rounded-xl"
          >
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="fromDate" className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Du
                </Label>
                <Input
                  id="fromDate"
                  type="date"
                  required
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 rounded-lg border-none bg-white dark:bg-zinc-900 font-extrabold text-[11px] px-2 shadow-inner"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="toDate" className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Au
                </Label>
                <Input
                  id="toDate"
                  type="date"
                  required
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 rounded-lg border-none bg-white dark:bg-zinc-900 font-extrabold text-[11px] px-2 shadow-inner"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={!fromDate || !toDate}
              className="w-full h-9 rounded-lg bg-zinc-900 text-white dark:bg-brand dark:hover:bg-brand/90 hover:bg-zinc-800 font-extrabold text-xs shadow"
            >
              Appliquer le filtre
            </Button>
          </form>
        )}
      </PopoverContent>
    </Popover>
  );
}
