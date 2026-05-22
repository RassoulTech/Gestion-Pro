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
import { getAdminStats, getPlatformGrowthStats } from "@/server/queries/admin.queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { KpiCard } from "@/components/kpi-card";
import { PageSkeleton } from "@/components/loading";
import { StatusBadge } from "@/components/status-badge";
import { PlatformChart } from "./_components/platform-chart";
import Link from "next/link";

export const metadata: Metadata = { title: "Admin Dashboard - Control Center" };

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8 pb-20">
      {/* Dynamic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 to-orange-950 p-8 sm:p-12 text-white shadow-2xl border border-white/10">
        <div className="absolute right-[-10%] top-[-20%] h-64 w-64 rounded-full bg-orange-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute left-[-10%] bottom-[-20%] h-64 w-64 rounded-full bg-amber-500/20 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                Plateforme Live
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter flex items-center gap-3">
              Centre de <span className="text-orange-400">Contrôle</span>
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400 animate-pulse" />
            </h1>
            <p className="text-sm text-slate-400 max-w-xl font-bold leading-relaxed">
              Supervisez les performances globales, les vendeurs inscrits, et les flux financiers de GestionPro en temps réel.
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<PageSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const [stats, growthData] = await Promise.all([
    getAdminStats(),
    getPlatformGrowthStats()
  ]);

  return (
    <div className="space-y-8">
      {/* Top Aggregation Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/60 p-6 shadow-xl shadow-slate-200/30 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none flex flex-col justify-between hover:border-amber-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
              <Users className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Utilisateurs
            </span>
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-950 dark:text-slate-50">
              {stats.totalUsers}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-bold">
              Comptes enregistrés
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/60 p-6 shadow-xl shadow-slate-200/30 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none flex flex-col justify-between hover:border-orange-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
              <UserCheck className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Vendeurs Actifs
            </span>
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-950 dark:text-slate-50">
              {stats.totalVendeursActifs} <span className="text-xl font-bold text-slate-300 dark:text-slate-600">/ {stats.totalVendeurs}</span>
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-bold">
              Marchands opérationnels
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/60 p-6 shadow-xl shadow-slate-200/30 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none flex flex-col justify-between hover:border-orange-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
              <Store className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Boutiques
            </span>
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-950 dark:text-slate-50">
              {stats.totalBoutiquesActives} <span className="text-xl font-bold text-slate-300 dark:text-slate-600">/ {stats.totalBoutiques}</span>
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-bold">
              Boutiques créées
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-600 to-orange-700 p-6 shadow-xl shadow-fuchsia-500/20 text-white flex flex-col justify-between">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white border border-white/20">
              <Wallet className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-100">
              CA SaaS
            </span>
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white truncate">
              {formatCurrency(stats.revenuTotal)}
            </h2>
            <p className="mt-1 text-xs text-fuchsia-100 font-bold">
              Revenu total abonnements
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid gap-6 grid-cols-2 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/50 bg-white/40 p-6 shadow-lg shadow-slate-200/30 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/30">
          <div className="flex items-center space-x-3 mb-3">
            <div className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800">
              <Package className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Produits</span>
          </div>
          <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">{stats.totalProduits}</span>
        </div>

        <div className="rounded-2xl border border-slate-200/50 bg-white/40 p-6 shadow-lg shadow-slate-200/30 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/30">
          <div className="flex items-center space-x-3 mb-3">
            <div className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800">
              <ShoppingCart className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Commandes</span>
          </div>
          <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">{stats.totalCommandes}</span>
        </div>

        <div className="col-span-2 md:col-span-1 rounded-2xl border border-orange-100 bg-orange-50/50 p-6 shadow-lg shadow-orange-100/30 dark:border-orange-900/30 dark:bg-orange-900/10 backdrop-blur-md">
          <div className="flex items-center space-x-3 mb-3">
            <div className="rounded-xl bg-orange-100 p-2.5 dark:bg-orange-900/50">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">Ventes Globales Boutiques</span>
          </div>
          <span className="text-3xl font-black tracking-tight text-orange-700 dark:text-orange-300 truncate block">
            {formatCurrency(stats.totalVentesGlobales)}
          </span>
        </div>
      </div>

      {/* Visual Analytics Chart */}
      <PlatformChart revenuTotal={stats.revenuTotal} revenuMensuel={stats.revenuMensuel} data={growthData} />

      {/* Double Column Log & User Activity Feed */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Merchants */}
        <div className="rounded-3xl border border-slate-200/60 bg-white/60 p-6 sm:p-8 shadow-xl shadow-slate-200/30 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                Nouveaux Vendeurs
              </h3>
            </div>
            <Link
              href="/admin/vendeurs"
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-orange-500 hover:text-white transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-orange-500 dark:hover:text-white"
            >
              Voir tout <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats.vendeursRecents.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Users className="h-8 w-8 text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-500">Aucun vendeur inscrit.</p>
              </div>
            ) : (
              stats.vendeursRecents.map((vendeur) => (
                <div
                  key={vendeur.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-orange-200 hover:shadow-md dark:border-white/5 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:hover:border-orange-500/30 transition-all duration-300"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white font-black text-sm shadow-lg shadow-orange-500/20">
                      {vendeur.nom.charAt(0).toUpperCase()}{vendeur.prenom.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-50">
                        {vendeur.prenom} {vendeur.nom}
                      </h4>
                      <p className="text-xs text-slate-500 font-bold mt-0.5 truncate max-w-[120px] sm:max-w-xs">{vendeur.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={vendeur.statut} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {vendeur._count.boutiques} boutique(s)
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions & Payments */}
        <div className="rounded-3xl border border-slate-200/60 bg-white/60 p-6 sm:p-8 shadow-xl shadow-slate-200/30 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                Derniers Paiements
              </h3>
            </div>
            <Link
              href="/admin/abonnements"
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-amber-500 hover:text-white transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-amber-500 dark:hover:text-white"
            >
              Voir tout <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats.paiementsRecents.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <CreditCard className="h-8 w-8 text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-500">Aucune transaction récente.</p>
              </div>
            ) : (
              stats.paiementsRecents.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-amber-200 hover:shadow-md dark:border-white/5 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:hover:border-amber-500/30 transition-all duration-300"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/40 dark:text-fuchsia-400 font-bold shadow-sm shrink-0">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-50">
                        {p.abonnement.vendeur.prenom} {p.abonnement.vendeur.nom}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                        <span className="text-orange-500">{p.abonnement.plan.nom}</span> • {p.methode}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-950 dark:text-slate-50">
                      {formatCurrency(p.montant)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{formatDate(p.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Live System Activity Feed */}
      <div className="rounded-3xl border border-slate-200/60 bg-white/60 p-6 sm:p-10 shadow-xl shadow-slate-200/30 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                Journal d&apos;Activité
              </h3>
            </div>
          </div>
          <Link
            href="/admin/logs"
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-orange-500 hover:text-white transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-orange-500 dark:hover:text-white"
          >
            Consulter les logs <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {stats.logsRecents.length === 0 ? (
            <p className="text-sm text-slate-500 font-bold text-center py-6">Aucune activité enregistrée.</p>
          ) : (
            stats.logsRecents.map((log) => (
              <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-5 gap-3 group hover:bg-white/50 dark:hover:bg-slate-800/30 px-4 rounded-2xl transition-colors -mx-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-slate-50 group-hover:text-orange-500 transition-colors">
                    {log.action}
                  </p>
                  <p className="text-[11px] text-slate-500 font-bold">
                    Par <span className="text-slate-700 dark:text-slate-300">{log.user?.name || log.user?.email || "Système"}</span> • Cible: <span className="text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded font-mono">{log.subjectType || "N/A"}</span>
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full uppercase">
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

