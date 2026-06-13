"use client";

import { useState } from "react";
import { Sparkles, Loader2, Info, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AiInsight } from "@/lib/ai/tasks";
import { generateDashboardInsightsAI } from "@/server/actions/ai.actions";

const NIVEAU_CONFIG: Record<AiInsight["niveau"], { icon: typeof TrendingUp; tone: string }> = {
  info: { icon: TrendingUp, tone: "text-brand bg-brand/10" },
  action: { icon: Lightbulb, tone: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400" },
  alerte: { icon: AlertTriangle, tone: "text-amber-600 bg-amber-500/10 dark:text-amber-400" },
};

/**
 * Conseils IA du dashboard : analyse les 30 derniers jours de la boutique
 * et produit 3-4 insights actionnables. Consomme un crédit IA par analyse.
 */
export function AiInsightsCard({ boutiqueId }: { boutiqueId: string }) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [err, setErr] = useState("");

  async function run() {
    if (loading) return;
    setLoading(true);
    setErr("");
    try {
      const r = await generateDashboardInsightsAI({ boutiqueId });
      if (r?.serverError) {
        setErr(r.serverError);
        toast.error(r.serverError);
        return;
      }
      if (r?.data?.insights?.length) {
        setInsights(r.data.insights);
      } else {
        setErr("Analyse impossible pour le moment. Réessayez plus tard.");
      }
    } catch {
      setErr("Analyse impossible pour le moment. Réessayez plus tard.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative rounded-[1.75rem] p-[1.5px] bg-gradient-to-r from-brand/40 via-brand/10 to-transparent">
      <div className="rounded-[1.65rem] bg-card p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-7 w-7 shrink-0 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wider text-foreground truncate">
                Conseils IA
              </p>
              <p className="text-[11px] font-medium text-muted-foreground truncate">
                Analyse des 30 derniers jours
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={run}
            disabled={loading}
            variant={insights.length ? "outline" : "brand"}
            className="h-10 rounded-xl font-black px-4 shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">{insights.length ? "Actualiser" : "Analyser ma boutique"}</span>
          </Button>
        </div>

        {err && (
          <div className="flex items-start gap-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-xl px-3 py-2">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {err}
          </div>
        )}

        {insights.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {insights.map((insight, i) => {
              const cfg = NIVEAU_CONFIG[insight.niveau] ?? NIVEAU_CONFIG.info;
              const Icon = cfg.icon;
              return (
                <li
                  key={`${insight.titre}-${i}`}
                  className="flex items-start gap-3 rounded-xl border border-border p-3"
                >
                  <span className={cn("h-8 w-8 shrink-0 rounded-lg flex items-center justify-center", cfg.tone)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-black leading-tight">{insight.titre}</p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground leading-relaxed">
                      {insight.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {insights.length === 0 && !err && !loading && (
          <p className="text-[11px] font-medium text-muted-foreground">
            Obtenez 3-4 conseils concrets basés sur vos ventes, votre stock et vos clients. Une analyse
            consomme un crédit IA.
          </p>
        )}
      </div>
    </div>
  );
}
