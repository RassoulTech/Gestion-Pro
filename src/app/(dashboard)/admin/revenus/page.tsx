import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { RevenusClientView } from "./_components/revenus-client-view";
import { TrendingUp } from "lucide-react";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { resolvePagePeriod } from "@/lib/period-server";

export const metadata: Metadata = { title: "Revenus - Admin" };

export default async function AdminRevenusPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; du?: string; au?: string }>;
}) {
  // Période : URL (local) > filtre global de session > 30 jours.
  const { period, source, fromIso, toIso } = await resolvePagePeriod(await searchParams, "30j");
  const inPeriod = { gte: period.from, lte: period.to };

  const [totalRevenu, revenuMois, recentPaiements] = await Promise.all([
    prisma.paiement.aggregate({ where: { statut: "CONFIRME" }, _sum: { montant: true } }),
    prisma.paiement.aggregate({
      where: { statut: "CONFIRME", createdAt: inPeriod },
      _sum: { montant: true },
    }),
    prisma.paiement.findMany({
      where: { createdAt: inPeriod },
      include: {
        abonnement: {
          select: {
            plan: { select: { nom: true } },
            vendeur: { select: { nom: true, prenom: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const total = totalRevenu._sum.montant ?? 0;
  const mensuel = revenuMois._sum.montant ?? 0;

  const typedPaiements = recentPaiements.map((p: any) => ({
    ...p,
    statut: p.statut as "EN_ATTENTE" | "CONFIRME" | "ECHOUE" | "REMBOURSE",
  }));

  return (
    <div className="space-y-8 pb-20">
      {/* Dynamic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 to-orange-950 p-6 sm:p-8 md:p-12 text-white shadow-2xl border border-white/10">
        <div className="absolute right-[-10%] top-[-20%] h-64 w-64 rounded-full bg-orange-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute left-[-10%] bottom-[-20%] h-64 w-64 rounded-full bg-amber-500/20 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter flex items-center flex-wrap gap-3">
              Chiffre d&apos;Affaires <span className="text-orange-400">SaaS</span>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400" />
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl font-bold leading-relaxed">
              Consultez les revenus globaux, suivez la croissance mensuelle et tracez les paiements des abonnements GestionPro.
            </p>
          </div>
        </div>
      </div>

      <PeriodFilter active={period.key} from={fromIso} to={toIso} source={source} />

      <div className="rounded-3xl border border-zinc-200/50 bg-white/60 backdrop-blur-xl p-2 sm:p-4 shadow-xl shadow-zinc-200/30 dark:border-white/10 dark:bg-zinc-900/50 dark:shadow-none">
        <RevenusClientView total={total} mensuel={mensuel} recentPaiements={typedPaiements} />
      </div>
    </div>
  );
}

