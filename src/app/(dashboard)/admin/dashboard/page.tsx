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
import { getLocale } from "next-intl/server";
import {
  getAdminStatsForPeriod,
  getGrowthSeriesForPeriod,
  getAdvancedAnalytics,
} from "@/server/queries/admin.queries";
import { resolvePeriod, pctChange, type Period } from "@/lib/periods";
import { formatCurrency, formatDate } from "@/lib/utils";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageSkeleton } from "@/components/loading";
import { StatusBadge } from "@/components/status-badge";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { PlatformChart } from "./_components/platform-chart";
import { AdvancedAnalyticsChart } from "./_components/advanced-analytics-chart";
import Link from "next/link";

export const metadata: Metadata = { title: "Tableau de bord Admin — Centre de contrôle" };
export const dynamic = "force-dynamic";

/** Pastille de variation vs période précédente (recalculée serveur). */
function DeltaChip({ current, previous }: { current: number; previous: number }) {
  const pct = pctChange(current, previous);
  const label = pct === null ? "Nouveau" : `${pct > 0 ? "+" : ""}${pct.toLocaleString("fr-FR")} %`;
  const tone =
    pct === null || pct > 0
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : pct < 0
        ? "bg-red-500/10 text-red-600 dark:text-red-400"
        : "bg-zinc-500/10 text-zinc-500";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black ${tone}`}>
      {label}
      <span className="ml-1 font-bold normal-case tracking-normal opacity-70">vs préc.</span>
    </span>
  );
}

/** Carte de statistique UNIFORME (mêmes fond/rayon/ombre pour toutes). */
function StatCard({
  icon: Icon, label, value, sub, delta, accent = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  sub: string;
  delta?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-500/40 hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${accent ? "bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-lg shadow-orange-500/25" : "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"}`}>
          <Icon className="h-6 w-6" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <div>
        <h2 className="truncate text-3xl font-black tracking-tight text-foreground sm:text-4xl">{value}</h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold text-muted-foreground">{sub}</p>
          {delta}
        </div>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; du?: string; au?: string }>;
}) {
  const sp = await searchParams;
  // FILTRE GLOBAL : URL (réglage local) > cookie de session > défaut 30 j.
  const { cookies } = await import("next/headers");
  const { GLOBAL_FILTER_COOKIE_ADMIN, resolveCanonicalParams } = await import("@/lib/global-filter");
  const cookieRaw = (await cookies()).get(GLOBAL_FILTER_COOKIE_ADMIN)?.value;
  const eff = resolveCanonicalParams(sp, cookieRaw ? decodeURIComponent(cookieRaw) : undefined, "30j");
  const period = resolvePeriod(eff.p, eff.du, eff.au);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <div className="space-y-8 pb-20">
      {/* Dynamic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 to-orange-950 p-6 sm:p-8 md:p-12 text-white shadow-2xl border border-white/10">
        <div className="absolute right-[-10%] top-[-20%] h-64 w-64 rounded-full bg-orange-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute left-[-10%] bottom-[-20%] h-64 w-64 rounded-full bg-amber-500/20 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                Plateforme Live
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter flex items-center flex-wrap gap-3">
              Centre de <span className="text-orange-400">Contrôle</span>
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400 animate-pulse" />
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl font-bold leading-relaxed">
              Supervisez les performances globales, les vendeurs inscrits, et les flux financiers de GestionPro en temps réel.
            </p>
          </div>
        </div>
      </div>

      {/* Filtre de période — pilote TOUTES les données ci-dessous via l'URL. */}
      <PeriodFilter active={period.key} from={iso(period.from)} to={iso(period.to)} writesGlobal source={eff.source} />

      <Suspense fallback={<PageSkeleton />}>
        <DashboardContent period={period} />
      </Suspense>
    </div>
  );
}

async function DashboardContent({ period }: { period: Period }) {
  const locale = (await getLocale()) === "en" ? "en" : "fr";
  const [stats, growthData, advancedData] = await Promise.all([
    getAdminStatsForPeriod(period),
    getGrowthSeriesForPeriod(period.from, period.to, locale),
    getAdvancedAnalytics()
  ]);

  return (
    <div className="space-y-8">
      {/* Cartes de statistiques — période filtrée, style UNIFORME */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Utilisateurs"
          value={<>{stats.usersVerifies} <span className="text-xl font-bold text-muted-foreground/50">/ {stats.users}</span></>}
          sub="Vérifiés / inscrits sur la période"
          delta={<DeltaChip current={stats.users} previous={stats.usersPrev} />}
        />
        <StatCard
          icon={UserCheck}
          label="Vendeurs"
          value={<>{stats.vendeursActifs} <span className="text-xl font-bold text-muted-foreground/50">/ {stats.vendeurs}</span></>}
          sub="Actifs / nouveaux sur la période"
          delta={<DeltaChip current={stats.vendeurs} previous={stats.vendeursPrev} />}
        />
        <StatCard
          icon={Store}
          label="Boutiques"
          value={<>{stats.boutiquesActives} <span className="text-xl font-bold text-muted-foreground/50">/ {stats.boutiques}</span></>}
          sub="Actives / créées sur la période"
          delta={<DeltaChip current={stats.boutiques} previous={stats.boutiquesPrev} />}
        />
        <StatCard
          icon={Wallet}
          label="CA SaaS"
          accent
          value={formatCurrency(stats.revenu)}
          sub="Revenu abonnements (période)"
          delta={<DeltaChip current={stats.revenu} previous={stats.revenuPrev} />}
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <KpiCard
          label="Produits"
          value={stats.produits.toLocaleString("fr-FR")}
          icon={Package}
          tone="neutral"
          subtext="Créés sur la période"
        />
        <KpiCard
          label="Commandes"
          value={stats.commandes.toLocaleString("fr-FR")}
          icon={ShoppingCart}
          tone="neutral"
          subtext="Sur la période"
        />
        <KpiCard
          className="col-span-2 md:col-span-1"
          label="Ventes Globales Boutiques"
          value={formatCurrency(stats.gmv)}
          icon={TrendingUp}
          tone="brand"
          subtext="Volume marchand (période)"
          accent
        />
      </div>

      {/* Visual Analytics Chart */}
      <PlatformChart revenuTotal={stats.revenu} revenuMensuel={stats.revenu} data={growthData} />

      {/* Advanced User & Plan Analytics */}
      <AdvancedAnalyticsChart data={advancedData} />

      {/* Double Column Log & User Activity Feed */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Merchants */}
        <div className="rounded-3xl border border-zinc-200/60 bg-white/60 p-6 sm:p-8 shadow-xl shadow-zinc-200/30 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/50 dark:shadow-none">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                Nouveaux Vendeurs
              </h3>
            </div>
            <Link
              href="/admin/vendeurs"
              className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-zinc-600 hover:bg-orange-500 hover:text-white transition-colors dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-orange-500 dark:hover:text-white"
            >
              Voir tout <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats.vendeursRecents.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Users className="h-8 w-8 text-zinc-300 mb-3" />
                <p className="text-sm font-bold text-zinc-500">Aucun vendeur inscrit.</p>
              </div>
            ) : (
              stats.vendeursRecents.map((vendeur) => (
                <div
                  key={vendeur.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-zinc-100 bg-zinc-50 hover:bg-white hover:border-orange-200 hover:shadow-md dark:border-white/5 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 dark:hover:border-orange-500/30 transition-all duration-300"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white font-black text-sm shadow-lg shadow-orange-500/20">
                      {vendeur.nom.charAt(0).toUpperCase()}{vendeur.prenom.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                        {vendeur.prenom} {vendeur.nom}
                      </h4>
                      <p className="text-xs text-zinc-500 font-bold mt-0.5 truncate max-w-[120px] sm:max-w-xs">{vendeur.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={vendeur.statut} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                      {vendeur._count.boutiques} boutique(s)
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions & Payments */}
        <div className="rounded-3xl border border-zinc-200/60 bg-white/60 p-6 sm:p-8 shadow-xl shadow-zinc-200/30 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/50 dark:shadow-none">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                Derniers Paiements
              </h3>
            </div>
            <Link
              href="/admin/abonnements"
              className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-zinc-600 hover:bg-amber-500 hover:text-white transition-colors dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-amber-500 dark:hover:text-white"
            >
              Voir tout <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats.paiementsRecents.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <CreditCard className="h-8 w-8 text-zinc-300 mb-3" />
                <p className="text-sm font-bold text-zinc-500">Aucune transaction récente.</p>
              </div>
            ) : (
              stats.paiementsRecents.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-zinc-100 bg-zinc-50 hover:bg-white hover:border-amber-200 hover:shadow-md dark:border-white/5 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 dark:hover:border-amber-500/30 transition-all duration-300"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400 font-bold shadow-sm shrink-0">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                        {p.abonnement.vendeur.prenom} {p.abonnement.vendeur.nom}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
                        <span className="text-orange-500">{p.abonnement.plan.nom}</span> • {p.methode}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-zinc-950 dark:text-zinc-50">
                      {formatCurrency(p.montant)}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase">{formatDate(p.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Live System Activity Feed */}
      <div className="rounded-3xl border border-zinc-200/60 bg-white/60 p-6 sm:p-10 shadow-xl shadow-zinc-200/30 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/50 dark:shadow-none">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                Journal d&apos;Activité
              </h3>
            </div>
          </div>
          <Link
            href="/admin/logs"
            className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-zinc-600 hover:bg-orange-500 hover:text-white transition-colors dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-orange-500 dark:hover:text-white"
          >
            Consulter les logs <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {stats.logsRecents.length === 0 ? (
            <p className="text-sm text-zinc-500 font-bold text-center py-6">Aucune activité enregistrée.</p>
          ) : (
            stats.logsRecents.map((log) => (
              <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-5 gap-3 group hover:bg-white/50 dark:hover:bg-zinc-800/30 px-4 rounded-2xl transition-colors -mx-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-black uppercase tracking-wider text-zinc-950 dark:text-zinc-50 group-hover:text-orange-500 transition-colors">
                    {log.action}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-bold">
                    Par <span className="text-zinc-700 dark:text-zinc-300">{log.user?.name || log.user?.email || "Système"}</span> • Cible: <span className="text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded font-mono">{log.subjectType || "N/A"}</span>
                  </p>
                </div>
                <span className="text-[10px] text-zinc-400 font-bold bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full uppercase">
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

