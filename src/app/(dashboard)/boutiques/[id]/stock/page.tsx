import type { Metadata } from "next";
import { headers } from "next/headers";
import { getMouvementsStock } from "@/server/queries/stock.queries";
import { StockClient } from "./_components/stock-client";
import { PremiumGuard } from "@/components/dashboard/premium-guard";
import { getBoutiqueOwnerQuotas } from "@/lib/quotas";
import { getBoutiqueProduits } from "@/server/queries/produit.queries";
import { AjustementStockModal } from "./_components/ajustement-modal";
import { parseDateFilter } from "@/lib/date-filters";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { UnifiedFilterPanel } from "@/components/dashboard/unified-filter-panel";
import { PeriodFilterSelect } from "@/components/dashboard/period-filter-select";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ComponentProps } from "react";

export const metadata: Metadata = { title: "Mouvements de stock" };

interface StockPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    q?: string;
    type?: string;
    source?: string;
    range?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function StockPage({ params, searchParams }: StockPageProps) {
  const { id } = await params;
  const { q, type, source, range, from, to, page: pageStr } = await searchParams;

  const userAgent = (await headers()).get("user-agent") || "";
  const isMobile = /mobile/i.test(userAgent);
  const limit = isMobile ? 20 : 30;
  const page = pageStr ? parseInt(pageStr, 10) : 1;

  const quotas = await getBoutiqueOwnerQuotas(id);
  const { data: produits } = await getBoutiqueProduits(id, { perPage: 1000 });

  const dateFilter = parseDateFilter(range, from, to);
  const filterParam = dateFilter.startDate || dateFilter.endDate ? dateFilter.whereClause : undefined;

  // Les cartes "Total Entrées" / "Total Sorties" reflètent la recherche, la
  // source et la période, mais PAS le filtre de type (sinon l'une des deux
  // serait toujours à zéro). On construit donc une base de where commune.
  const aggregateBaseWhere: Prisma.MouvementStockWhereInput = {
    boutiqueId: id,
    ...(source && source !== "ALL" && { sourceType: source }),
    ...(q && {
      OR: [
        { produit: { nom: { contains: q, mode: "insensitive" } } },
        { produit: { code: { contains: q, mode: "insensitive" } } },
        { sourceType: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(filterParam && { date: filterParam }),
  };

  const [mouvementsResult, totalEntreesAgg, totalSortiesAgg, sourceRows] = await Promise.all([
    getMouvementsStock(id, {
      search: q,
      type: type,
      source: source,
      page,
      perPage: limit,
      dateFilter: filterParam,
    }),
    prisma.mouvementStock.aggregate({
      where: { ...aggregateBaseWhere, type: "ENTREE" },
      _sum: { quantite: true },
    }),
    prisma.mouvementStock.aggregate({
      where: { ...aggregateBaseWhere, type: "SORTIE" },
      _sum: { quantite: true },
    }),
    // Valeurs sourceType réellement présentes → options de filtre fiables
    prisma.mouvementStock.findMany({
      where: { boutiqueId: id },
      select: { sourceType: true },
      distinct: ["sourceType"],
    }),
  ]);

  const totalEntrees = totalEntreesAgg._sum.quantite || 0;
  const totalSorties = totalSortiesAgg._sum.quantite || 0;
  const availableSources = sourceRows
    .map((r) => r.sourceType)
    .filter((s): s is string => !!s)
    .sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-6 sm:space-y-8 pb-6 sm:pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Mouvements de stock</h1>
          <p className="text-sm text-muted-foreground font-medium">Historique complet des entrées et sorties de marchandises</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <PeriodFilterSelect />
          <AjustementStockModal boutiqueId={id} produits={produits} />
        </div>
      </div>
      
      <PremiumGuard
        currentPlanName={quotas.nom}
        featureName="Stock avancé & Historique des mouvements"
        featureDescription="Suivez chaque entrée et sortie de stock, avec un historique complet et des indicateurs avancés. Disponible dès le plan Pro."
      >
        {/* Panel de Filtres (Pleine largeur dans le corps) */}
        <UnifiedFilterPanel
          searchPlaceholder="Rechercher par produit..."
          typeOptions={[
            { value: "ALL", label: "Tous les types" },
            { value: "ENTREE", label: "Entrées" },
            { value: "SORTIE", label: "Sorties" },
          ]}
          sourceOptions={availableSources}
        />

        {/* Contenu principal */}
        <div className="space-y-6">
            <StockClient
              mouvements={mouvementsResult.data as ComponentProps<typeof StockClient>["mouvements"]}
              total={mouvementsResult.total}
              totalEntrees={totalEntrees}
              totalSorties={totalSorties}
              availableSources={availableSources}
            />
            <SimplePagination
              totalItems={mouvementsResult.total}
              itemsPerPage={limit}
              currentPage={page}
            />
        </div>
      </PremiumGuard>
    </div>
  );
}
