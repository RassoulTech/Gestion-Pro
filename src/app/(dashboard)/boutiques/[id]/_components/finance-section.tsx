"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FinanceData {
  ventesTotal: number;
  ventesMois: number;
  ventesSemaine: number;
  depensesTotal: number;
  depensesMois: number;
  depensesSemaine: number;
}

export function FinanceSection({ data }: { data: FinanceData }) {
  const [periode, setPeriode] = useState<"mois" | "semaine">("mois");

  const totalVentes = periode === "mois" ? data.ventesMois : data.ventesSemaine;
  const totalDepenses = periode === "mois" ? data.depensesMois : data.depensesSemaine;
  const benefice = totalVentes - totalDepenses;
  const periodeLabel = periode === "semaine" ? "cette semaine" : "ce mois";
  const marge = totalVentes > 0 ? (benefice / totalVentes) * 100 : 0;

  return (
    <Card className="border-none bg-white dark:bg-zinc-900 shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden">
      <CardHeader className="p-5 sm:p-10 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-xl sm:text-3xl font-black tracking-tight flex items-center gap-2 sm:gap-3">
            <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-brand" />
            Performance Financière
          </CardTitle>
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-fit">
            <button
              onClick={() => setPeriode("semaine")}
              className={cn(
                "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-all",
                periode === "semaine"
                  ? "bg-white dark:bg-zinc-700 shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Semaine
            </button>
            <button
              onClick={() => setPeriode("mois")}
              className={cn(
                "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-all",
                periode === "mois"
                  ? "bg-white dark:bg-zinc-700 shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Mois
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-10 pt-6 sm:pt-8">
        <div className="grid gap-4 sm:gap-10 md:grid-cols-2">
          <div className="space-y-4 sm:space-y-6">
            <div className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20">
              <div className="flex items-center gap-2 opacity-80 mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">
                  Revenu Brut
                </span>
              </div>
              <div className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tighter break-words">
                {totalVentes.toLocaleString()}
                <span className="text-sm sm:text-lg lg:text-2xl opacity-70 ml-1">FCFA</span>
              </div>
              <p className="mt-2 sm:mt-4 text-[10px] sm:text-xs font-bold opacity-70">
                Ventes validées {periodeLabel}
              </p>
            </div>
            <div className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] bg-rose-500 text-white shadow-2xl shadow-rose-500/20">
              <div className="flex items-center gap-2 opacity-80 mb-2">
                <TrendingDown className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">
                  Charges totales
                </span>
              </div>
              <div className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tighter break-words">
                {totalDepenses.toLocaleString()}
                <span className="text-sm sm:text-lg lg:text-2xl opacity-70 ml-1">FCFA</span>
              </div>
              <p className="mt-2 sm:mt-4 text-[10px] sm:text-xs font-bold opacity-70">
                Dépenses {periodeLabel}
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 gap-4">
            <div className="space-y-2">
              <h4 className="text-base sm:text-lg font-black tracking-tight">
                Bénéfice Net
              </h4>
              <p className="text-xs sm:text-sm font-bold text-muted-foreground">
                Profit {periodeLabel} après déduction des dépenses.
              </p>
            </div>
            <div
              className={cn(
                "text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter break-words",
                benefice >= 0 ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {benefice.toLocaleString()}
              <span className="text-sm sm:text-lg ml-1 opacity-50">FCFA</span>
            </div>
            <div className="pt-4 sm:pt-6 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest">
                  Marge bénéficiaire
                </span>
                <span
                  className={cn(
                    "text-xs sm:text-sm font-black",
                    benefice >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}
                >
                  {marge.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    benefice >= 0 ? "bg-emerald-500" : "bg-rose-500"
                  )}
                  style={{
                    width: `${Math.max(0, Math.min(100, Math.abs(marge)))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
