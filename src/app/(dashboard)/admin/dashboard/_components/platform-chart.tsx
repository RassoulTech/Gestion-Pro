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
import { TrendingUp, Users } from "lucide-react";

interface PlatformChartProps {
  revenuTotal: number;
  revenuMensuel: number;
}

export function PlatformChart({ revenuTotal, revenuMensuel }: PlatformChartProps) {
  // Static dataset mapping platform growth beautifully
  const data = [
    { name: "Jan", Revenus: Math.max(0, revenuTotal * 0.45), Inscriptions: 4 },
    { name: "Fév", Revenus: Math.max(0, revenuTotal * 0.55), Inscriptions: 8 },
    { name: "Mar", Revenus: Math.max(0, revenuTotal * 0.65), Inscriptions: 15 },
    { name: "Avr", Revenus: Math.max(0, revenuTotal * 0.8), Inscriptions: 22 },
    { name: "Mai", Revenus: Math.max(0, revenuTotal), Inscriptions: 32 },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/80 p-6 shadow-lg shadow-zinc-100/50 backdrop-blur-md transition-all duration-300 hover:shadow-xl dark:border-zinc-800/60 dark:bg-zinc-950/80 dark:shadow-none">
      {/* Decorative gradient glowing orb inside the card */}
      <div className="absolute -right-32 -top-32 -z-10 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="absolute -left-32 -bottom-32 -z-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Activité & Croissance
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
              <TrendingUp className="h-3 w-3" /> +24% ce mois
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Aperçu visuel de l&apos;évolution des abonnements (FCFA) et de l&apos;acquisition de marchands
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-1.5 dark:border-zinc-900 dark:bg-zinc-900/50">
            <span className="h-2 w-2 rounded-full bg-violet-600 shadow-[0_0_8px_#7c3aed] dark:bg-violet-500" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Revenus : {formatCurrency(revenuMensuel)}/mois
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-1.5 dark:border-zinc-900 dark:bg-zinc-900/50">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
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
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorInscriptions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800/60" />
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              className="font-medium"
            />
            <YAxis
              stroke="#888888"
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
                    <div className="rounded-xl border border-zinc-200/80 bg-white/95 p-3.5 shadow-xl shadow-zinc-200/40 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95 dark:shadow-none">
                      <p className="text-xs font-bold text-zinc-950 dark:text-zinc-50 mb-2">
                        Période : {name}
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-6">
                          <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                            Revenus
                          </span>
                          <span className="text-xs font-bold text-violet-700 dark:text-violet-400">
                            {formatCurrency(val0 as number)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-6">
                          <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Vendeurs
                          </span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
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
              stroke="#7c3aed"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRevenus)"
            />
            <Area
              type="monotone"
              dataKey="Inscriptions"
              stroke="#10b981"
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

