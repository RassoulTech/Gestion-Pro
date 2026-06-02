import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { CategoriesClient } from "./_components/categories-client";
import { TableSkeleton } from "@/components/loading";
import { parseDateFilter } from "@/lib/date-filters";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { UnifiedFilterPanel } from "@/components/dashboard/unified-filter-panel";
import { PeriodFilterSelect } from "@/components/dashboard/period-filter-select";

export const metadata: Metadata = { title: "Catégories" };

interface CategoriesPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    q?: string;
    range?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function CategoriesPage({
  params,
  searchParams,
}: CategoriesPageProps) {
  const { id: boutiqueId } = await params;
  const { q, range, from, to, page: pageStr } = await searchParams;

  // Pagination setups based on mobile/desktop headers
  const userAgent = (await headers()).get("user-agent") || "";
  const isMobile = /mobile/i.test(userAgent);
  const limit = isMobile ? 20 : 30;
  const page = pageStr ? parseInt(pageStr, 10) : 1;
  const skip = (page - 1) * limit;

  const dateFilter = parseDateFilter(range, from, to);

  const whereClause: any = {
    boutiqueId,
  };

  // Date range filter
  if (dateFilter.startDate || dateFilter.endDate) {
    whereClause.createdAt = dateFilter.whereClause;
  }

  // Search filter
  if (q) {
    whereClause.nom = { contains: q, mode: "insensitive" };
  }

  const [categories, filteredCount] = await Promise.all([
    prisma.categorie.findMany({
      where: whereClause,
      include: {
        _count: { select: { produits: true } },
      },
      orderBy: { nom: "asc" },
      skip,
      take: limit,
    }),
    prisma.categorie.count({ where: whereClause }),
  ]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Catégories</h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Organisez vos produits par catégorie
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <PeriodFilterSelect />
        </div>
      </div>

      {/* Panel de Filtres (Pleine largeur dans le corps) */}
      <UnifiedFilterPanel
        searchPlaceholder="Rechercher une catégorie..."
      />

      {/* Contenu principal */}
      <div className="space-y-6">
          {/* Categories Grid List */}
          <CategoriesClient categories={categories} boutiqueId={boutiqueId} />

          {/* Pagination controls */}
          <SimplePagination
            totalItems={filteredCount}
            itemsPerPage={limit}
            currentPage={page}
          />
      </div>
    </div>
  );
}
