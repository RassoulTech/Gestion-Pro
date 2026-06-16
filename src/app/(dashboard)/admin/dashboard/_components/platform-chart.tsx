"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface PlatformChartProps {
  revenuTotal: number;
  revenuMensuel: number;
  data: { name: string; Revenus: number; Inscriptions: number }[];
}

export function PlatformChart({ revenuTotal, revenuMensuel, data = [] }: PlatformChartProps) {
  // Calculate percentage growth for inscriptions (this month vs last month)
  let growth = 0;
  if (data && data.length >= 2) {
    const currentMonthData = data[data.length - 1];
    const lastMonthData = data[data.length - 2];
    
    if (currentMonthData && lastMonthData) {
      const currentMonth = currentMonthData.Inscriptions;
      const lastMonth = lastMonthData.Inscriptions;
      if (lastMonth > 0) {
        growth = Math.round(((currentMonth - lastMonth) / lastMonth) * 100);
      } else if (currentMonth > 0) {
        growth = 100;
      }
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/60 p-6 shadow-lg shadow-slate-100/50 backdrop-blur-xl transition-all duration-300 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none">
      {/* Decorative gradient glowing orb inside the card */}
      <div className="absolute -right-32 -top-32 -z-10 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="absolute -left-32 -bottom-32 -z-10 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Activité & Croissance
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 px-2 py-0.5 text-[10px] font-black text-fuchsia-600 dark:text-fuchsia-400">
              <TrendingUp className="h-3 w-3" /> {growth >= 0 ? `+${growth}` : growth}% ce mois
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Aperçu visuel de l&apos;évolution des abonnements (FCFA) et de l&apos;acquisition de marchands
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-1.5 dark:border-slate-800/60 dark:bg-slate-900/50">
            <span className="h-2 w-2 rounded-full bg-fuchsia-500 shadow-[0_0_8px_#d946ef]" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Revenus : {formatCurrency(revenuMensuel)}/mois
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-1.5 dark:border-slate-800/60 dark:bg-slate-900/50">
            <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_#06b6d4]" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Marchands Actifs
            </span>
          </div>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d946ef" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#d946ef" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorInscriptions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800/60" />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              className="font-medium"
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              className="font-medium"
              tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}M` : v >= 1000 ? `${v / 1000}k` : v)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length >= 2) {
                  const p0 = payload[0];
                  const p1 = payload[1];
                  const name = p0?.payload?.name ?? "";
                  const val0 = p0?.value ?? 0;
                  const val1 = p1?.value ?? 0;
                  return (
                    <div className="rounded-xl border border-slate-200/80 bg-white/95 p-3.5 shadow-xl shadow-slate-200/40 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/95 dark:shadow-none">
                      <p className="text-xs font-bold text-slate-950 dark:text-slate-50 mb-2">
                        Période : {name}
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-6">
                          <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-500" />
                            Revenus
                          </span>
                          <span className="text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400">
                            {formatCurrency(val0 as number)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-6">
                          <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                            Vendeurs
                          </span>
                          <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                            {val1} inscrits
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="Revenus"
              stroke="#d946ef"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRevenus)"
            />
            <Area
              type="monotone"
              dataKey="Inscriptions"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorInscriptions)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

