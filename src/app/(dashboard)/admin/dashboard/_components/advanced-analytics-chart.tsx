"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AdvancedAnalyticsChartProps {
  data: {
    name: string;
    totalUsers: number;
    sansBoutique: number;
    gratuit: number;
    pro: number;
    enterprise: number;
  }[];
}

export function AdvancedAnalyticsChart({ data = [] }: AdvancedAnalyticsChartProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/60 p-6 shadow-lg shadow-zinc-100/50 backdrop-blur-xl transition-all duration-300 hover:shadow-xl dark:border-white/10 dark:bg-zinc-900/50 dark:shadow-none">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Répartition des Utilisateurs & Forfaits
            </h3>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Analyse détaillée des comptes dormants et des paliers de souscription.
          </p>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-zinc-800/60" />
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
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const dataObj = payload[0]?.payload;
                  if (!dataObj) return null;
                  return (
                    <div className="rounded-xl border border-zinc-200/80 bg-white/95 p-3.5 shadow-xl shadow-zinc-200/40 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95 dark:shadow-none min-w-[200px]">
                      <p className="text-xs font-bold text-zinc-950 dark:text-zinc-50 mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        Période : {dataObj.name}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                            <span className="h-2 w-2 rounded-full bg-zinc-300" />
                            Total Inscrits
                          </span>
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                            {dataObj.totalUsers}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                            <span className="h-2 w-2 rounded-full bg-red-400" />
                            Sans Boutique
                          </span>
                          <span className="text-xs font-bold text-red-500 dark:text-red-400">
                            {dataObj.sansBoutique}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                            <span className="h-2 w-2 rounded-full bg-zinc-400" />
                            Gratuit (Starter)
                          </span>
                          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                            {dataObj.gratuit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                            <span className="h-2 w-2 rounded-full bg-orange-400" />
                            Forfait Pro
                          </span>
                          <span className="text-xs font-bold text-orange-500">
                            {dataObj.pro}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            Enterprise
                          </span>
                          <span className="text-xs font-bold text-amber-500">
                            {dataObj.enterprise}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            <Bar dataKey="sansBoutique" name="Sans Boutique" stackId="a" fill="#f87171" radius={[0, 0, 4, 4]} />
            <Bar dataKey="gratuit" name="Gratuit" stackId="a" fill="#94a3b8" />
            <Bar dataKey="pro" name="Forfait Pro" stackId="a" fill="#fb923c" />
            <Bar dataKey="enterprise" name="Enterprise" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
