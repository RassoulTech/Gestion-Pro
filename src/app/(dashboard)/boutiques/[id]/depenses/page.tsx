import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { DepensesClient } from "./_components/depenses-client";
import { parseDateFilter } from "@/lib/date-filters";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { PeriodFilterSelect } from "@/components/dashboard/period-filter-select";

interface DepensesPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    q?: string;
    range?: string;
    from?: string;
    to?: string;
    page?: string;
    category?: string;
  }>;
}

export default async function DepensesPage({ params, searchParams }: DepensesPageProps) {
  const { id: boutiqueId } = await params;
  const { q, range, from, to, page: pageStr, category } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userAgent = (await headers()).get("user-agent") || "";
  const isMobile = /mobile/i.test(userAgent);
  const limit = isMobile ? 20 : 30;
  const page = pageStr ? parseInt(pageStr, 10) : 1;
  const skip = (page - 1) * limit;

  const dateFilter = parseDateFilter(range, from, to);

  const whereClause: any = {
    boutiqueId,
  };

  if (dateFilter.startDate || dateFilter.endDate) {
    whereClause.date = dateFilter.whereClause;
  }

  if (category && category !== "all" && category !== "ALL") {
    whereClause.categorie = category;
  }

  if (q) {
    whereClause.OR = [
      { libelle: { contains: q, mode: "insensitive" } },
      { categorie: { contains: q, mode: "insensitive" } },
    ];
  }

  const [depenses, totalCount, totalAmountResult] = await Promise.all([
    prisma.depense.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.depense.count({
      where: whereClause,
    }),
    prisma.depense.aggregate({
      where: whereClause,
      _sum: {
        montant: true,
      },
    }),
  ]);

  const totalDepenses = totalAmountResult._sum.montant || 0;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Depenses</h1>
          <p className="text-muted-foreground font-medium">Suivez vos couts operationnels et charges fixes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <PeriodFilterSelect />
          <Button asChild variant="brand" className="flex-1 sm:flex-initial rounded-xl h-12 px-6 font-black shadow-lg shadow-brand/20">
            <Link href={`/boutiques/${boutiqueId}/depenses/new`}>
              <Plus className="mr-2 h-5 w-5" />
              Nouvelle Depense
            </Link>
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="space-y-6">
          <DepensesClient depenses={depenses} boutiqueId={boutiqueId} totalDepenses={totalDepenses} />

          <SimplePagination
            totalItems={totalCount}
            itemsPerPage={limit}
            currentPage={page}
          />
      </div>
    </div>
  );
}
