import type { Metadata } from "next";
import { headers } from "next/headers";
import { getBoutiqueFournisseurs } from "@/server/queries/fournisseur.queries";
import { FournisseursClient } from "./_components/fournisseurs-client";
import { parseDateFilter } from "@/lib/date-filters";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { UnifiedFilterPanel } from "@/components/dashboard/unified-filter-panel";
import { PeriodFilterSelect } from "@/components/dashboard/period-filter-select";

export const metadata: Metadata = { title: "Fournisseurs" };

interface FournisseursPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    q?: string;
    range?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function FournisseursPage({ params, searchParams }: FournisseursPageProps) {
  const { id } = await params;
  const { q, range, from, to, page: pageStr } = await searchParams;

  const userAgent = (await headers()).get("user-agent") || "";
  const isMobile = /mobile/i.test(userAgent);
  const limit = isMobile ? 20 : 30;
  const page = pageStr ? parseInt(pageStr, 10) : 1;

  const dateFilter = parseDateFilter(range, from, to);

  const filterParam = dateFilter.startDate || dateFilter.endDate ? dateFilter.whereClause : undefined;

  const fournisseurs = await getBoutiqueFournisseurs(id, {
    search: q,
    page,
    perPage: limit,
    dateFilter: filterParam,
  });

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Fournisseurs</h1>
          <p className="text-muted-foreground font-medium">Gérez vos fournisseurs et vos achats</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <PeriodFilterSelect />
        </div>
      </div>

      {/* Panel de Filtres (Pleine largeur dans le corps) */}
      <UnifiedFilterPanel
        searchPlaceholder="Rechercher un fournisseur..."
      />

      {/* Contenu principal */}
      <div className="space-y-6">
          <FournisseursClient fournisseurs={fournisseurs.data} boutiqueId={id} total={fournisseurs.total} />
          
          <SimplePagination
            totalItems={fournisseurs.total}
            itemsPerPage={limit}
            currentPage={page}
          />
      </div>
    </div>
  );
}
