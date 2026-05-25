import type { Metadata } from "next";
import { Suspense } from "react";
import { getMouvementsStock } from "@/server/queries/stock.queries";
import { TableSkeleton } from "@/components/loading";
import { StockClient } from "./_components/stock-client";
import { PremiumGuard } from "@/components/dashboard/premium-guard";
import { getBoutiqueOwnerQuotas } from "@/lib/quotas";
import { getBoutiqueProduits } from "@/server/queries/produit.queries";
import { AjustementStockModal } from "./_components/ajustement-modal";

export const metadata: Metadata = { title: "Mouvements de stock" };

async function StockContent({ boutiqueId }: { boutiqueId: string }) {
  const { data: mouvements } = await getMouvementsStock(boutiqueId, { perPage: 250 });

  return <StockClient mouvements={mouvements} />;
}

export default async function StockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quotas = await getBoutiqueOwnerQuotas(id);
  const { data: produits } = await getBoutiqueProduits(id, { perPage: 1000 });

  return (
    <div className="space-y-6 sm:space-y-8 pb-6 sm:pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Mouvements de stock</h1>
          <p className="text-sm text-muted-foreground font-medium">Historique complet des entrées et sorties de marchandises</p>
        </div>
        <AjustementStockModal boutiqueId={id} produits={produits} />
      </div>
      <PremiumGuard
        currentPlanName={quotas.nom}
        featureName="Stock avancé & Historique des mouvements"
        featureDescription="Suivez chaque entrée et sortie de stock, avec un historique complet et des indicateurs avancés. Disponible dès le plan Pro."
      >
        <Suspense fallback={<TableSkeleton />}><StockContent boutiqueId={id} /></Suspense>
      </PremiumGuard>
    </div>
  );
}
