import { prisma } from "@/lib/prisma";
import { RevenusClientView } from "./_components/revenus-client-view";
import { TrendingUp } from "lucide-react";

export const metadata = { title: "Revenus - Admin" };

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
    <div className="space-y-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0 border-b border-zinc-100 pb-6 dark:border-zinc-900">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-emerald-50 p-2 dark:bg-emerald-950/30">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Chiffre d&apos;Affaires SaaS
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Consultez le chiffre d&apos;affaires global généré par les abonnements GestionPro.
          </p>
        </div>
      </div>

      <RevenusClientView total={total} mensuel={mensuel} recentPaiements={typedPaiements} />
    </div>
  );
}

