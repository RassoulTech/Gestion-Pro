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
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4 flex flex-col justify-between sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Croissance de la Plateforme
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Évolution des abonnements (FCFA) et inscriptions marchands
          </p>
        </div>
        <div className="mt-2 flex items-center space-x-4 sm:mt-0">
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-600 dark:bg-violet-500" />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Revenus
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Marchands
            </span>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorInscriptions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
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
                    <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-md dark:border-zinc-800 dark:bg-zinc-950">
                      <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 mb-1.5">
                        {name}
                      </p>
                      <div className="space-y-1">
                        <p className="text-xs text-violet-600 dark:text-violet-400">
                          Revenus : <span className="font-semibold">{formatCurrency(val0 as number)}</span>
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-500">
                          Nouveaux Vendeurs : <span className="font-semibold">{val1}</span>
                        </p>
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
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorRevenus)"
            />
            <Area
              type="monotone"
              dataKey="Inscriptions"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorInscriptions)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
