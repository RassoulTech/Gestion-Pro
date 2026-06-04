import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Plus, CheckCircle2, Clock, FileEdit } from "lucide-react";
import { getBoutiqueOwnerQuotas } from "@/lib/quotas";
import { getFacturesForBoutique, getFactureStats } from "@/server/queries/facture.queries";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PremiumGuard } from "@/components/dashboard/premium-guard";
import { FacturesClient } from "./_components/factures-client";

export const metadata: Metadata = { title: "Factures" };

export default async function FacturesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [quotas, factures, stats] = await Promise.all([
    getBoutiqueOwnerQuotas(id),
    getFacturesForBoutique(id),
    getFactureStats(id),
  ]);

  const cards = [
    { label: "Total factures", value: String(stats.total), icon: FileText, tint: "text-brand bg-brand/10" },
    { label: "Payées", value: String(stats.counts.PAYEE), icon: CheckCircle2, tint: "text-emerald-600 bg-emerald-500/10" },
    { label: "Impayées", value: String(stats.counts.IMPAYEE), icon: Clock, tint: "text-amber-600 bg-amber-500/10" },
    { label: "Encaissé", value: formatCurrency(stats.montantPaye), icon: FileEdit, tint: "text-slate-700 dark:text-slate-200 bg-slate-500/10" },
  ];

  return (
    <div className="space-y-5 sm:space-y-8 pb-20 sm:pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-brand" /> Factures
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Émettez des factures pour vos ventes physiques et services.
          </p>
        </div>
        <Button asChild variant="brand" className="w-full sm:w-auto rounded-xl h-11 sm:h-12 px-6 font-black shadow-lg shadow-brand/20">
          <Link href={`/boutiques/${id}/factures/new`}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle facture
          </Link>
        </Button>
      </div>

      <PremiumGuard
        currentPlanName={quotas.nom}
        featureName="Factures manuelles"
        featureDescription="Émettez des factures professionnelles pour vos ventes physiques et services, avec PDF et suivi des paiements."
      >
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${c.tint}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="mt-3 text-lg sm:text-2xl font-black tracking-tight">{c.value}</p>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">{c.label}</p>
              </div>
            );
          })}
        </div>

        <FacturesClient boutiqueId={id} factures={factures} />
      </PremiumGuard>
    </div>
  );
}
