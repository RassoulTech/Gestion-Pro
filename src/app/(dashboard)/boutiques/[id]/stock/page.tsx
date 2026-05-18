import { Suspense } from "react";
import { getMouvementsStock } from "@/server/queries/stock.queries";
import { TableSkeleton } from "@/components/loading";
import { StockClient } from "./_components/stock-client";

export const metadata = { title: "Mouvements de stock" };

async function StockContent({ boutiqueId }: { boutiqueId: string }) {
  const { data: mouvements } = await getMouvementsStock(boutiqueId, { perPage: 250 });

  return <StockClient mouvements={mouvements as any} />;
}

export default async function StockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6 sm:space-y-8 pb-6 sm:pb-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Mouvements de stock</h1>
        <p className="text-sm text-muted-foreground font-medium">Historique complet des entrées et sorties de marchandises</p>
      </div>
      <Suspense fallback={<TableSkeleton />}><StockContent boutiqueId={id} /></Suspense>
    </div>
  );
}
