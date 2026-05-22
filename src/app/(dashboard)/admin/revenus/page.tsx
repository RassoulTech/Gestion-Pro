import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { RevenusClientView } from "./_components/revenus-client-view";
import { TrendingUp } from "lucide-react";

export const metadata: Metadata = { title: "Revenus - Admin" };

export default async function AdminRevenusPage() {
  const [totalRevenu, revenuMois, recentPaiements] = await Promise.all([
    prisma.paiement.aggregate({ where: { statut: "CONFIRME" }, _sum: { montant: true } }),
    prisma.paiement.aggregate({
      where: {
        statut: "CONFIRME",
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { montant: true },
    }),
    prisma.paiement.findMany({
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

  const typedPaiements = recentPaiements.map((p) => ({
    ...p,
    statut: p.statut as "EN_ATTENTE" | "CONFIRME" | "ECHOUE" | "REMBOURSE",
  }));

  return (
    <div className="space-y-8 pb-20">
      {/* Dynamic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 to-orange-950 p-8 sm:p-12 text-white shadow-2xl border border-white/10">
        <div className="absolute right-[-10%] top-[-20%] h-64 w-64 rounded-full bg-orange-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute left-[-10%] bottom-[-20%] h-64 w-64 rounded-full bg-amber-500/20 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter flex items-center gap-3">
              Chiffre d&apos;Affaires <span className="text-orange-400">SaaS</span>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400" />
            </h1>
            <p className="text-sm text-slate-400 max-w-xl font-bold leading-relaxed">
              Consultez les revenus globaux, suivez la croissance mensuelle et tracez les paiements des abonnements GestionPro.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/50 bg-white/60 backdrop-blur-xl p-2 sm:p-4 shadow-xl shadow-slate-200/30 dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none">
        <RevenusClientView total={total} mensuel={mensuel} recentPaiements={typedPaiements} />
      </div>
    </div>
  );
}

