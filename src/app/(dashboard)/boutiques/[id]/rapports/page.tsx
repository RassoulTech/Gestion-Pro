import type { Metadata } from "next";
import { Suspense } from "react";
import { TrendingUp, Package, Users } from "lucide-react";
import { getBoutiqueStats, getVentesParJour, getTopProduits } from "@/server/queries/dashboard.queries";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesChart } from "@/components/charts/sales-chart";
import { TopProductsChart } from "@/components/charts/top-products-chart";
import { PageSkeleton } from "@/components/loading";
import { PDFDownloadButton } from "@/components/pdf-download-button";
import { PremiumGuard } from "@/components/dashboard/premium-guard";
import { getBoutiqueOwnerQuotas } from "@/lib/quotas";

export const metadata: Metadata = { title: "Rapports" };

async function RapportsContent({ boutiqueId, period = 30 }: { boutiqueId: string, period?: number }) {
  const [stats, ventesJour, topProduits] = await Promise.all([
    getBoutiqueStats(boutiqueId),
    getVentesParJour(boutiqueId, period),
    getTopProduits(boutiqueId, 10),
  ]);

  return (
    <Tabs defaultValue="ventes">
      <TabsList>
        <TabsTrigger value="ventes">Ventes</TabsTrigger>
        <TabsTrigger value="produits">Produits</TabsTrigger>
      </TabsList>
      <TabsContent value="ventes" className="mt-5 sm:mt-8 space-y-5 sm:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <Card className="border-none bg-zinc-900 text-white shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem]">
            <CardHeader className="pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-zinc-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Ventes aujourd&apos;hui
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <p className="text-2xl sm:text-3xl font-black">{formatCurrency(stats.ventesToday)}</p>
            </CardContent>
          </Card>
          <Card className="border-none bg-zinc-900 text-white shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem]">
            <CardHeader className="pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produits
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <p className="text-2xl sm:text-3xl font-black">{stats.totalProduits}</p>
            </CardContent>
          </Card>
          <Card className="border-none bg-zinc-900 text-white shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem]">
            <CardHeader className="pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Clients
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <p className="text-2xl sm:text-3xl font-black">{stats.totalClients}</p>
            </CardContent>
          </Card>
        </div>
        <Card className="border-none shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden">
          <CardContent className="p-3 sm:p-6">
            <SalesChart data={ventesJour} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="produits" className="mt-5 sm:mt-8">
        <Card className="border-none shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden">
          <CardContent className="p-3 sm:p-6">
            <TopProductsChart data={topProduits} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export default async function RapportsPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ period?: string }> }) {
  const { id } = await params;
  const sParams = await searchParams;
  const period = sParams.period ? parseInt(sParams.period, 10) : 30;

  const [boutique, quotas] = await Promise.all([
    prisma.boutique.findUnique({ where: { id }, select: { nom: true } }),
    getBoutiqueOwnerQuotas(id),
  ]);

  const boutiqueName = boutique?.nom ?? "Boutique";
  const currentPlanName = quotas.nom;

  return (
    <div className="space-y-5 sm:space-y-8 pb-6 sm:pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Rapports</h1>
          <p className="text-sm text-muted-foreground font-medium">Analysez les performances de votre boutique</p>
        </div>
      </div>

      <PremiumGuard
        currentPlanName={currentPlanName}
        featureName="Rapports Détaillés & Analytics"
        featureDescription="Obtenez des graphiques interactifs avancés sur l'évolution de vos ventes et de vos stocks."
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            {[7, 30, 90, 365].map((d) => (
              <a
                key={d}
                href={`?period=${d}`}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                  period === d
                    ? "bg-white dark:bg-zinc-700 shadow-sm text-brand"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                }`}
              >
                {d === 365 ? "1 An" : `${d} jours`}
              </a>
            ))}
          </div>
          <PDFDownloadButton boutiqueId={id} boutiqueName={boutiqueName} period={period} />
        </div>
        <Suspense fallback={<PageSkeleton />}>
          <RapportsContent boutiqueId={id} period={period} />
        </Suspense>
      </PremiumGuard>
    </div>
  );
}
