import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { headers } from "next/headers";

import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { markNotificationsSeen } from "@/server/services/notifications";
import { NotifsRefreshPing } from "@/components/notifications/notifs-refresh-ping";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  CommandesClientTable,
  type CommandeRow,
} from "./_components/commandes-client-table";
import { parseDateFilterWithGlobal } from "@/lib/date-filters-server";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { FilterPanel } from "@/components/dashboard/filter-panel";

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
  const t = await getTranslations("dashboard.pages");

  // Pagination setups based on mobile/desktop headers
  const userAgent = (await headers()).get("user-agent") || "";
  const isMobile = /mobile/i.test(userAgent);
  const limit = isMobile ? 20 : 30;
  const page = pageStr ? parseInt(pageStr, 10) : 1;
  const skip = (page - 1) * limit;

  const dateFilter = await parseDateFilterWithGlobal(range, from, to);

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

  // « Lu au passage » : voir la liste des commandes efface les alertes de paiement.
  await markNotificationsSeen(["PAIEMENT_CONFIRME", "NOUVELLE_COMMANDE"], id);

  return (
    <>
      <NotifsRefreshPing />
      <div className="space-y-5 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{t("ordersTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("ordersSubtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Button asChild variant="brand" className="flex-1 sm:flex-initial rounded-xl font-bold shadow-lg shadow-brand/20 h-11">
            <Link href={`/boutiques/${id}/commandes/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Commande
            </Link>
          </Button>
        </div>
      </div>

      {/* Barre de filtres unifiée (recherche + statut + période) */}
      <FilterPanel
        defaultRange="30days"
        searchPlaceholder="Rechercher par code ou client…"
        selects={[
          {
            param: "status",
            label: "Statut",
            allLabel: "Tous",
            options: [
              { value: "EN_ATTENTE", label: "En attente" },
              { value: "VALIDEE", label: "Validée" },
              { value: "LIVREE", label: "Livrée" },
              { value: "ANNULEE", label: "Annulée" },
            ],
          },
        ]}
      />

      {/* Contenu principal */}
      <div className="space-y-6">
          <CommandesClientTable boutiqueId={id} commandes={rows} totalItems={totalCount} />

          <SimplePagination
            totalItems={totalCount}
            itemsPerPage={limit}
            currentPage={page}
          />
      </div>
    </div>
  </>
  );
}

