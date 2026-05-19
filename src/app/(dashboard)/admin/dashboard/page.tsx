import type { Metadata } from "next";
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
  Sparkles,
} from "lucide-react";
import { getAdminStats } from "@/server/queries/admin.queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { KpiCard } from "@/components/kpi-card";
import { PageSkeleton } from "@/components/loading";
import { StatusBadge } from "@/components/status-badge";
import { PlatformChart } from "./_components/platform-chart";
import Link from "next/link";

export const metadata: Metadata = { title: "Admin Dashboard - Control Center" };

async function AdminStatsContent() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-8">
      {/* Top Aggregation Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/70 p-6 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800/50 dark:bg-zinc-950/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Utilisateurs Plateforme
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
              {stats.totalUsers}
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Total des comptes enregistrés
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/70 p-6 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800/50 dark:bg-zinc-950/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Vendeurs Actifs
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
              {stats.totalVendeursActifs} <span className="text-lg font-normal text-zinc-400">/ {stats.totalVendeurs}</span>
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Marchands opérationnels actifs
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/70 p-6 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800/50 dark:bg-zinc-950/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Boutiques Créées
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
              <Store className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
              {stats.totalBoutiquesActives} <span className="text-lg font-normal text-zinc-400">/ {stats.totalBoutiques}</span>
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Boutiques actives en ligne
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white/90 p-6 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-blue-950/30 dark:from-blue-950/20 dark:to-zinc-950/75">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-600/10 blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
              Chiffre d&apos;Affaires SaaS
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)] dark:bg-blue-500">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-blue-950 dark:text-blue-50">
              {formatCurrency(stats.revenuTotal)}
            </h2>
            <p className="mt-1 text-xs text-blue-600/80 dark:text-blue-300/80">
              Revenu total des abonnements
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid gap-6 grid-cols-2 md:grid-cols-3">
        <div className="group rounded-2xl border border-zinc-200/50 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-zinc-800/50 dark:bg-zinc-950">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-900 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30 transition-colors">
              <Package className="h-4 w-4 text-zinc-500 group-hover:text-blue-600 transition-colors" />
            </div>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Produits Plateforme</span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{stats.totalProduits}</span>
            <p className="text-[10px] text-zinc-400 mt-0.5">Produits enregistrés par les boutiques</p>
          </div>
        </div>

        <div className="group rounded-2xl border border-zinc-200/50 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-zinc-800/50 dark:bg-zinc-950">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-900 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30 transition-colors">
              <ShoppingCart className="h-4 w-4 text-zinc-500 group-hover:text-blue-600 transition-colors" />
            </div>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Commandes Globales</span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{stats.totalCommandes}</span>
            <p className="text-[10px] text-zinc-400 mt-0.5">Commandes passées au total</p>
          </div>
        </div>

        <div className="group col-span-2 md:col-span-1 rounded-2xl border border-zinc-200/50 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-zinc-800/50 dark:bg-zinc-950">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/30 group-hover:bg-emerald-100/70 transition-colors">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Volume de Ventes</span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.totalVentesGlobales)}
            </span>
            <p className="text-[10px] text-zinc-400 mt-0.5">Valeur globale des marchandises vendues</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Chart */}
      <PlatformChart revenuTotal={stats.revenuTotal} revenuMensuel={stats.revenuMensuel} />

      {/* Double Column Log & User Activity Feed */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Merchants */}
        <div className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-lg shadow-zinc-100/40 dark:border-zinc-800/50 dark:bg-zinc-950 dark:shadow-none">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Nouveaux Vendeurs
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Les derniers marchands inscrits sur la plateforme
              </p>
            </div>
            <Link
              href="/admin/vendeurs"
              className="inline-flex items-center gap-1 rounded-lg bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80"
            >
              Voir tout <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {stats.vendeursRecents.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-6">Aucun vendeur inscrit.</p>
            ) : (
              stats.vendeursRecents.map((vendeur) => (
                <div
                  key={vendeur.id}
                  className="group flex items-center justify-between p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/30 hover:bg-white hover:border-zinc-200 hover:shadow-sm dark:border-zinc-900 dark:bg-zinc-900/10 dark:hover:bg-zinc-900/40 dark:hover:border-zinc-800 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 text-white font-bold text-sm shadow-[0_4px_12px_rgba(37,99,235,0.15)]">
                      {vendeur.nom.charAt(0).toUpperCase()}{vendeur.prenom.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {vendeur.prenom} {vendeur.nom}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">{vendeur.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="hidden sm:inline-flex text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full dark:bg-zinc-800 dark:text-zinc-400">
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
        <div className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-lg shadow-zinc-100/40 dark:border-zinc-800/50 dark:bg-zinc-950 dark:shadow-none">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Derniers Paiements
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Flux des abonnements de la plateforme en temps réel
              </p>
            </div>
            <Link
              href="/admin/abonnements"
              className="inline-flex items-center gap-1 rounded-lg bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80"
            >
              Voir tout <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {stats.paiementsRecents.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-6">Aucune transaction récente.</p>
            ) : (
              stats.paiementsRecents.map((p) => (
                <div
                  key={p.id}
                  className="group flex items-center justify-between p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/30 hover:bg-white hover:border-zinc-200 hover:shadow-sm dark:border-zinc-900 dark:bg-zinc-900/10 dark:hover:bg-zinc-900/40 dark:hover:border-zinc-800 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 font-semibold shadow-sm">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {p.abonnement.vendeur.prenom} {p.abonnement.vendeur.nom}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Plan <span className="font-semibold text-blue-600 dark:text-blue-400">{p.abonnement.plan.nom}</span> • {p.methode}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                      {formatCurrency(p.montant)}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{formatDate(p.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Live System Activity Feed */}
      <div className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-lg shadow-zinc-100/40 dark:border-zinc-800/50 dark:bg-zinc-950 dark:shadow-none">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-blue-50 p-2.5 dark:bg-blue-950/30">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Journal d&apos;Activité Plateforme
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Traces d&apos;activité en temps réel sur GestionPro
              </p>
            </div>
          </div>
          <Link
            href="/admin/logs"
            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-950/50"
          >
            Consulter les logs <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {stats.logsRecents.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-6">Aucune activité enregistrée.</p>
          ) : (
            stats.logsRecents.map((log) => (
              <div key={log.id} className="flex items-start justify-between py-4 group">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 group-hover:text-blue-600 transition-colors">
                    {log.action}
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                    Par <span className="font-semibold">{log.user?.name || log.user?.email || "Système"}</span> • Sujet: <span className="font-mono text-zinc-600 dark:text-zinc-300">{log.subjectType || "N/A"}</span>
                  </p>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono font-medium">
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
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0 border-b border-zinc-100 pb-6 dark:border-zinc-900">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Centre de Contrôle Global
            </h1>
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Supervisez les performances, les vendeurs inscrits et les flux financiers de GestionPro.
          </p>
        </div>
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full dark:bg-emerald-950/30 dark:text-emerald-400">
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

