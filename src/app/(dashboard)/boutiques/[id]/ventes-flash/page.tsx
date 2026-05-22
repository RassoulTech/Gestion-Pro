import type { Metadata } from "next";
import { Suspense } from "react";
import { Zap, ShoppingBag } from "lucide-react";
import { getBoutiqueVentesFlash } from "@/server/queries/commande.queries";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/loading";
import { EmptyState } from "@/components/empty-state";
import { PremiumGuard } from "@/components/dashboard/premium-guard";
import { getBoutiqueOwnerQuotas } from "@/lib/quotas";

export const metadata: Metadata = { title: "Ventes Flash" };

async function VentesFlashContent({ boutiqueId }: { boutiqueId: string }) {
  const { data: ventes } = await getBoutiqueVentesFlash(boutiqueId);

  if (ventes.length === 0) {
    return <EmptyState icon={Zap} title="Aucune vente flash" description="Les ventes flash apparaîtront ici." />;
  }

  return (
    <>
      {/* Desktop View */}
      <div className="hidden sm:block">
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50 dark:bg-zinc-800/50">
                    <TableHead className="font-black uppercase text-[10px] tracking-widest pl-6">Code</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Date</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest hidden md:table-cell">Client</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Total</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-6">Art.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventes.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium pl-6">
                        {v.code}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDateTime(v.date)}</TableCell>
                      <TableCell className="hidden md:table-cell">{v.nomClient || "—"}</TableCell>
                      <TableCell className="text-right font-semibold whitespace-nowrap text-brand">{formatCurrency(v.total)}</TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                          {v._count.lignes}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="sm:hidden flex flex-col gap-4">
        {ventes.map((v) => (
          <div key={v.id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">{v.code}</h3>
                  <p className="text-[10px] text-zinc-500 font-semibold">{formatDateTime(v.date)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-brand text-sm">{formatCurrency(v.total)}</p>
                <div className="flex items-center justify-end gap-1 text-[10px] text-zinc-400 font-semibold mt-1">
                  <ShoppingBag className="h-3 w-3" />
                  {v._count.lignes} articles
                </div>
              </div>
            </div>
            
            {v.nomClient && (
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Client : <span className="text-zinc-900 dark:text-zinc-200">{v.nomClient}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default async function VentesFlashPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quotas = await getBoutiqueOwnerQuotas(id);
  const currentPlanName = quotas.nom;

  return (
    <div className="space-y-5 sm:space-y-8 pb-6 sm:pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Ventes Flash</h1>
          <p className="text-sm text-muted-foreground font-medium">Ventes rapides au comptoir</p>
        </div>
      </div>

      <PremiumGuard
        currentPlanName={currentPlanName}
        featureName="Ventes Flash & POS Avancé"
        featureDescription="Accédez à un terminal de caisse ultra-rapide pour enregistrer vos ventes au comptoir en 1 clic."
      >
        <div className="flex justify-end">
          <Button variant="brand" className="w-full sm:w-auto rounded-xl h-11 sm:h-12 px-6 font-black shadow-lg shadow-brand/20">
            <Zap className="mr-2 h-4 w-4" /> Nouvelle vente
          </Button>
        </div>
        <Suspense fallback={<TableSkeleton />}><VentesFlashContent boutiqueId={id} /></Suspense>
      </PremiumGuard>
    </div>
  );
}
