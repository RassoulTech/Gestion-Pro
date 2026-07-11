import type { Metadata } from "next";
import { Truck, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getBoutiqueCommandesFournisseur } from "@/server/queries/commande.queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { parseDateFilterWithGlobal } from "@/lib/date-filters-server";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { FilterPanel } from "@/components/dashboard/filter-panel";

export const metadata: Metadata = { title: "Commandes fournisseur" };

interface CommandesFournisseurPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    q?: string;
    range?: string;
    from?: string;
    to?: string;
    page?: string;
    supplierId?: string;
  }>;
}

export default async function CommandesFournisseurPage({ params, searchParams }: CommandesFournisseurPageProps) {
  const { id } = await params;
  const { q, range, from, to, page: pageStr, supplierId } = await searchParams;

  const userAgent = (await headers()).get("user-agent") || "";
  const isMobile = /mobile/i.test(userAgent);
  const limit = isMobile ? 20 : 30;
  const page = pageStr ? parseInt(pageStr, 10) : 1;

  const dateFilter = await parseDateFilterWithGlobal(range, from, to);
  const filterParam = dateFilter.startDate || dateFilter.endDate ? dateFilter.whereClause : undefined;
  const t = await getTranslations("dashboard.pages");

  const [{ data: commandes, total }, fournisseurs] = await Promise.all([
    getBoutiqueCommandesFournisseur(id, {
      search: q,
      page,
      perPage: limit,
      dateFilter: filterParam,
      supplierId,
    }),
    prisma.fournisseur.findMany({
      where: { boutiqueId: id },
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
  ]);

  return (
    <div className="space-y-5 sm:space-y-8 pb-6 sm:pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t("supplierPurchasesTitle")}</h1>
          <p className="text-muted-foreground font-medium">{t("supplierPurchasesSubtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Button asChild variant="brand" className="flex-1 sm:flex-initial rounded-xl h-12 px-6 font-black shadow-lg shadow-brand/20">
            <Link href={`/boutiques/${id}/commandes-fournisseur/new`}>
              <Plus className="mr-2 h-5 w-5" />
              Nouvel Achat
            </Link>
          </Button>
        </div>
      </div>

      {/* Barre de filtres unifiée (recherche + fournisseur + période) */}
      <FilterPanel
        defaultRange="30days"
        searchPlaceholder="Rechercher un achat (code)…"
        selects={
          fournisseurs.length
            ? [
                {
                  param: "supplierId",
                  label: "Fournisseur",
                  allLabel: "Tous",
                  options: fournisseurs.map((f) => ({ value: f.id, label: f.nom })),
                },
              ]
            : []
        }
      />

      {/* Contenu principal */}
      <div className="space-y-6">
          {q && (
            <div className="text-xs text-muted-foreground font-bold mb-4">
              {total} achat{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""} pour &quot;{q}&quot;
            </div>
          )}

          {commandes.length === 0 ? (
            <EmptyState icon={Truck} title="Aucun achat" description={q || range ? "Ajustez vos filtres pour afficher des résultats." : "Les achats fournisseur apparaîtront ici."} />
          ) : (
            <Card className="border-none shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-zinc-50 dark:bg-zinc-800/50">
                        <TableHead className="font-black uppercase text-[10px] tracking-widest pl-4 sm:pl-6">Code</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest hidden sm:table-cell">Date</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest hidden md:table-cell">Fournisseur</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Total</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest pr-4 sm:pr-6">État</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commandes.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium pl-4 sm:pl-6">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <span>{c.code}</span>
                                <span className="block text-[10px] text-muted-foreground sm:hidden">{formatDate(c.date)}</span>
                                <span className="block text-[10px] text-muted-foreground md:hidden sm:block">{c.fournisseur.nom}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell whitespace-nowrap">{formatDate(c.date)}</TableCell>
                          <TableCell className="hidden md:table-cell">{c.fournisseur.nom}</TableCell>
                          <TableCell className="text-right font-semibold whitespace-nowrap">{formatCurrency(c.total)}</TableCell>
                          <TableCell className="pr-4 sm:pr-6"><StatusBadge status={c.etat} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          <SimplePagination
            totalItems={total}
            itemsPerPage={limit}
            currentPage={page}
          />
      </div>
    </div>
  );
}
