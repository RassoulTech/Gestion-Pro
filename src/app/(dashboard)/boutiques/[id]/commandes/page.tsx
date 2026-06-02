import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  CommandesClientTable,
  type CommandeRow,
} from "./_components/commandes-client-table";
import { parseDateFilter } from "@/lib/date-filters";
import { DashboardFilter } from "@/components/dashboard/dashboard-filter";
import { SimplePagination } from "@/components/ui/simple-pagination";

interface CommandesPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    q?: string;
    status?: string;
    range?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function CommandesPage({ params, searchParams }: CommandesPageProps) {
  const { id } = await params;
  const { q, status, range, from, to, page: pageStr } = await searchParams;
  
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Pagination setups based on mobile/desktop headers
  const userAgent = (await headers()).get("user-agent") || "";
  const isMobile = /mobile/i.test(userAgent);
  const limit = isMobile ? 20 : 30;
  const page = pageStr ? parseInt(pageStr, 10) : 1;
  const skip = (page - 1) * limit;

  const dateFilter = parseDateFilter(range, from, to);

  const whereClause: any = {
    boutiqueId: id,
  };

  // Date range filter on date field
  if (dateFilter.startDate || dateFilter.endDate) {
    whereClause.date = dateFilter.whereClause;
  }

  // Search query (code or client nom/prenom)
  if (q) {
    whereClause.OR = [
      { code: { contains: q, mode: "insensitive" } },
      { client: { nom: { contains: q, mode: "insensitive" } } },
      { client: { prenom: { contains: q, mode: "insensitive" } } },
    ];
  }

  // Status filter
  if (status && status !== "ALL") {
    whereClause.etat = status;
  }

  const [boutique, commandesList, totalCount] = await Promise.all([
    prisma.boutique.findUnique({
      where: { id },
      select: { nom: true },
    }),
    prisma.commandeClient.findMany({
      where: whereClause,
      include: {
        client: { select: { nom: true, prenom: true } },
        _count: { select: { lignes: true } },
      },
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.commandeClient.count({
      where: whereClause,
    }),
  ]);

  if (!boutique) notFound();

  const rows: CommandeRow[] = commandesList.map((c) => ({
    id: c.id,
    code: c.code,
    date: c.date.toISOString(),
    total: c.total,
    etat: c.etat,
    lignesCount: c._count.lignes,
    client: c.client ? { prenom: c.client.prenom, nom: c.client.nom } : null,
  }));

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Commandes Clients</h1>
          <p className="text-sm text-muted-foreground">Gérez vos ventes et livraisons</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <DashboardFilter />
          <Button asChild variant="brand" className="flex-1 sm:flex-initial rounded-xl font-bold shadow-lg shadow-brand/20 h-11">
            <Link href={`/boutiques/${id}/commandes/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Commande
            </Link>
          </Button>
        </div>
      </div>

      <CommandesClientTable boutiqueId={id} commandes={rows} totalItems={totalCount} />

      <SimplePagination
        totalItems={totalCount}
        itemsPerPage={limit}
        currentPage={page}
      />
    </div>
  );
}

