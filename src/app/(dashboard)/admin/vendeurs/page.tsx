import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllVendeurs } from "@/server/queries/admin.queries";
import { TableSkeleton } from "@/components/loading";
import { VendeursClientTable } from "./_components/vendeurs-client-table";
import { Store } from "lucide-react";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { resolvePagePeriod } from "@/lib/period-server";
import type { Period } from "@/lib/periods";

export const metadata: Metadata = { title: "Vendeurs - Admin" };

async function VendeursContent({ period }: { period: Period }) {
  const { data: vendeurs, total } = await getAllVendeurs({ from: period.from, to: period.to });

  // Cast statut to meet expected type exactly
  const typedVendeurs = vendeurs.map((v: any) => ({
    ...v,
    statut: v.statut as "ACTIF" | "SUSPENDU",
  }));

  return <VendeursClientTable initialVendeurs={typedVendeurs} total={total} />;
}

export default async function AdminVendeursPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; du?: string; au?: string }>;
}) {
  // Registre long → défaut « Année » ; réglage local > filtre global > défaut.
  const { period, source, fromIso, toIso } = await resolvePagePeriod(await searchParams, "annee");

  return (
    <div className="space-y-8 pb-20">
      {/* Dynamic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 to-orange-950 p-6 sm:p-8 md:p-12 text-white shadow-2xl border border-white/10">
        <div className="absolute right-[-10%] top-[-20%] h-64 w-64 rounded-full bg-orange-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute left-[-10%] bottom-[-20%] h-64 w-64 rounded-full bg-amber-500/20 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter flex items-center flex-wrap gap-3">
              Annuaire <span className="text-orange-400">Vendeurs</span>
              <Store className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400" />
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl font-bold leading-relaxed">
              Gérez le statut des marchands de la plateforme, supervisez leurs boutiques et validez leurs accès en un clin d&apos;œil.
            </p>
          </div>
        </div>
      </div>

      <PeriodFilter active={period.key} from={fromIso} to={toIso} source={source} />

      <Suspense fallback={<TableSkeleton />}>
        <div className="rounded-3xl border border-zinc-200/50 bg-white/60 backdrop-blur-xl p-2 sm:p-4 shadow-xl shadow-zinc-200/30 dark:border-white/10 dark:bg-zinc-900/50 dark:shadow-none">
          <VendeursContent period={period} />
        </div>
      </Suspense>
    </div>
  );
}

