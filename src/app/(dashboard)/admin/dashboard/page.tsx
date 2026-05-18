import { Suspense } from "react";
import {
  Users,
  Store,
  CreditCard,
  UserCheck,
  Wallet,
  Package,
  ShoppingCart,
  Activity,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { getAdminStats } from "@/server/queries/admin.queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { KpiCard } from "@/components/kpi-card";
import { PageSkeleton } from "@/components/loading";
import { StatusBadge } from "@/components/status-badge";
import { PlatformChart } from "./_components/platform-chart";
import Link from "next/link";

export const metadata = { title: "Admin Dashboard - Control Center" };

async function AdminStatsContent() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-6">
      {/* Top Aggregation Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Utilisateurs Plateforme"
          value={stats.totalUsers}
          icon={Users}
          description="Total des comptes enregistrés"
          className="bg-white hover:shadow-md transition-all duration-200"
        />
        <KpiCard
          title="Vendeurs Actifs"
          value={`${stats.totalVendeursActifs} / ${stats.totalVendeurs}`}
          icon={UserCheck}
          description="Marchands opérationnels"
          className="bg-white hover:shadow-md transition-all duration-200"
        />
        <KpiCard
          title="Boutiques Créées"
          value={`${stats.totalBoutiquesActives} / ${stats.totalBoutiques}`}
          icon={Store}
          description="Boutiques actives en ligne"
          className="bg-white hover:shadow-md transition-all duration-200"
        />
        <KpiCard
          title="Chiffre d'Affaires SaaS"
          value={formatCurrency(stats.revenuTotal)}
          icon={Wallet}
          description="Revenu total abonnements"
          className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/20 dark:to-zinc-900 border-violet-100 hover:shadow-md transition-all duration-200"
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-500">Produits Platform</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-semibold tracking-tight">{stats.totalProduits}</span>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-500">Commandes Globales</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-semibold tracking-tight">{stats.totalCommandes}</span>
          </div>
        </div>
        <div className="col-span-2 md:col-span-1 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-zinc-500">Volume de Ventes</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.totalVentesGlobales)}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Chart */}
      <PlatformChart revenuTotal={stats.revenuTotal} revenuMensuel={stats.revenuMensuel} />

      {/* Double Column Log & User Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Merchants */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Nouveaux Vendeurs
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Les derniers marchands inscrits sur la plateforme
              </p>
            </div>
            <Link
              href="/admin/vendeurs"
              className="inline-flex items-center text-xs font-medium text-violet-600 hover:text-violet-500"
            >
              Voir tout <ArrowUpRight className="ml-1 h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {stats.vendeursRecents.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">Aucun vendeur inscrit.</p>
            ) : (
              stats.vendeursRecents.map((vendeur) => (
                <div
                  key={vendeur.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 font-semibold text-sm">
                      {vendeur.nom.charAt(0)}{vendeur.prenom.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {vendeur.prenom} {vendeur.nom}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{vendeur.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full dark:bg-zinc-800">
                      {vendeur._count.boutiques} boutique(s)
                    </span>
                    <StatusBadge status={vendeur.statut} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions & Payments */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Derniers Paiements
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Flux des abonnements de la plateforme
              </p>
            </div>
            <Link
              href="/admin/abonnements"
              className="inline-flex items-center text-xs font-medium text-violet-600 hover:text-violet-500"
            >
              Voir tout <ArrowUpRight className="ml-1 h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {stats.paiementsRecents.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">Aucune transaction récente.</p>
            ) : (
              stats.paiementsRecents.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {p.abonnement.vendeur.prenom} {p.abonnement.vendeur.nom}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Plan {p.abonnement.plan.nom} • {p.methode}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {formatCurrency(p.montant)}
                    </p>
                    <p className="text-[10px] text-zinc-500">{formatDate(p.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Live System Activity Feed */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-violet-600" />
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Journal d&apos;Activité Plateforme
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Traces d&apos;activité en temps réel sur GestionPro
              </p>
            </div>
          </div>
          <Link
            href="/admin/logs"
            className="inline-flex items-center text-xs font-medium text-violet-600 hover:text-violet-500"
          >
            Consulter les logs <ArrowUpRight className="ml-1 h-3 w-3" />
          </Link>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {stats.logsRecents.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">Aucune activité enregistrée.</p>
          ) : (
            stats.logsRecents.map((log) => (
              <div key={log.id} className="flex items-start justify-between py-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-50">
                    {log.action}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    Par {log.user?.name || log.user?.email || "Système"} • Type: {log.subjectType || "N/A"}
                  </p>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {formatDate(log.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between space-y-2 sm:flex-row sm:items-center sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Centre de Contrôle Global
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Supervisez les performances, utilisateurs et revenus de GestionPro
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-950/20">
            Plateforme Live
          </span>
        </div>
      </div>

      <Suspense fallback={<PageSkeleton />}>
        <AdminStatsContent />
      </Suspense>
    </div>
  );
}
