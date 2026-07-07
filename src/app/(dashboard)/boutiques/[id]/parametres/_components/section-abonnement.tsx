"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Calendar, TrendingUp, Package, Store, Users, ShoppingBag, ArrowUpRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Quota {
  label: string;
  count: number;
  max: number;
  icon: React.ComponentType<{ className?: string }>;
}

interface Props {
  boutiqueId: string;
  initial: {
    planNom: string;
    planStatut: string;
    isActive: boolean;
    dateDebut: Date | string | null;
    dateFin: Date | string | null;
    essaiFin: Date | string | null;
    montant: number;
    quotas: {
      produits: { count: number; max: number };
      boutiques: { count: number; max: number };
      membres: { count: number; max: number };
      commandes: number;
    };
  };
}

function statutBadge(statut: string) {
  if (statut === "ACTIF") {
    return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" variant="outline">Actif</Badge>;
  }
  if (statut === "ESSAI") {
    return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" variant="outline">Période d&apos;essai</Badge>;
  }
  return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" variant="outline">Expiré</Badge>;
}

function QuotaCard({ label, count, max, icon: Icon }: Quota) {
  const unlimited = max >= 999999;
  const pct = unlimited ? 0 : Math.min(100, Math.round((count / Math.max(max, 1)) * 100));
  const danger = pct >= 90;
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center">
          <Icon className="h-4 w-4 text-brand" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</span>
      </div>
      <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
        {count}
        {!unlimited && <span className="text-zinc-400 font-bold text-base"> / {max}</span>}
      </p>
      {!unlimited && (
        <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${danger ? "bg-red-500" : "bg-brand"}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export function SectionAbonnement({ boutiqueId, initial }: Props) {
  const renewalDate = initial.dateFin || initial.essaiFin;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-32 w-32 bg-brand/20 blur-3xl rounded-full" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <Sparkles className="h-3 w-3 text-brand" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Forfait actuel</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">{initial.planNom}</h3>
            <p className="text-xs font-medium text-zinc-400">
              {initial.montant > 0
                ? `${initial.montant.toLocaleString("fr-FR")} FCFA / mois`
                : "Plan gratuit"}
            </p>
          </div>
          <div>{statutBadge(initial.planStatut)}</div>
        </div>

        <div className="relative z-10 grid gap-3 sm:grid-cols-2 mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Activation</p>
              <p className="text-xs font-bold text-zinc-100">
                {initial.dateDebut
                  ? new Date(initial.dateDebut).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                  : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RefreshCw className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Prochaine échéance</p>
              <p className="text-xs font-bold text-zinc-100">
                {renewalDate
                  ? new Date(renewalDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
          <Package className="h-3 w-3" /> Utilisation
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuotaCard label="Produits" count={initial.quotas.produits.count} max={initial.quotas.produits.max} icon={Package} />
          <QuotaCard label="Boutiques" count={initial.quotas.boutiques.count} max={initial.quotas.boutiques.max} icon={Store} />
          <QuotaCard label="Membres" count={initial.quotas.membres.count} max={initial.quotas.membres.max} icon={Users} />
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-brand" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Commandes</span>
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{initial.quotas.commandes}</p>
            <p className="text-[10px] font-medium text-zinc-400">Total cette boutique</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild className="h-12 rounded-xl font-bold text-sm bg-brand hover:bg-brand/90 text-white">
          <Link href={`/pricing?boutiqueId=${boutiqueId}`}>
            <TrendingUp className="mr-2 h-4 w-4" /> Changer de forfait
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-12 rounded-xl font-bold text-sm border-zinc-200 dark:border-zinc-800">
          <Link href={`/boutiques/${boutiqueId}/facturation`}>
            <ArrowUpRight className="mr-2 h-4 w-4" /> Renouveler / Facturation
          </Link>
        </Button>
      </div>
    </div>
  );
}
