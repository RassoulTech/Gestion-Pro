import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, DollarSign, Wallet, ArrowUpRight, TrendingUp } from "lucide-react";

export const metadata = { title: "Revenus - Admin" };

export default async function AdminRevenusPage() {
  const [totalRevenu, revenuMois] = await Promise.all([
    prisma.paiement.aggregate({ where: { statut: "CONFIRME" }, _sum: { montant: true } }),
    prisma.paiement.aggregate({
      where: {
        statut: "CONFIRME",
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { montant: true },
    }),
  ]);

  const total = totalRevenu._sum.montant ?? 0;
  const mensuel = revenuMois._sum.montant ?? 0;

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
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

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white/90 p-8 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-violet-950/30 dark:from-violet-950/20 dark:to-zinc-950/75">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-600/10 blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
              Chiffre d&apos;Affaires Cumulé
            </span>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.3)] dark:bg-violet-500">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-6">
            <h2 className="text-4xl font-extrabold tracking-tight text-violet-950 dark:text-violet-50">
              {formatCurrency(total)}
            </h2>
            <p className="mt-2 text-xs text-violet-600/80 dark:text-violet-300/80">
              Volume total des paiements validés depuis le lancement de la plateforme.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white/90 p-8 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-emerald-950/30 dark:from-emerald-950/20 dark:to-zinc-950/75">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-600/10 blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Revenus Mensuels
            </span>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)] dark:bg-emerald-500">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-6">
            <h2 className="text-4xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-50">
              {formatCurrency(mensuel)}
            </h2>
            <p className="mt-2 text-xs text-emerald-600/80 dark:text-emerald-300/80">
              Montant cumulé des paiements confirmés pour le mois en cours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

