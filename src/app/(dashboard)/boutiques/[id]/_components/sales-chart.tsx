/* eslint-disable @typescript-eslint/no-unused-vars */
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

interface SalesDataPoint {
  date: string;
  total: number;
}

interface SalesChartClientProps {
  data: SalesDataPoint[];
}

export function SalesChartClient({ data }: SalesChartClientProps) {
  return (
    <ResponsiveContainer width="100%" height={256}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickFormatter={(v) => formatCurrency(v)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
          }}
          formatter={(value: number) => [formatCurrency(value), "Ventes"]}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#6366f1"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorTotal)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/**
 * Server-side wrapper qui charge les données ventes 30 derniers jours.
 * Tant que la query n'est pas branchée, affiche un état vide propre.
 */
 
export async function SalesChart({ boutiqueId: _boutiqueId }: { boutiqueId: string }) {
  // TODO: brancher getBoutiqueSalesByDay(boutiqueId)
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
      Graphique des ventes — bientôt disponible
    </div>
  );
}
