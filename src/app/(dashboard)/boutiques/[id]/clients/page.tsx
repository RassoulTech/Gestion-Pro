/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { Plus, Users, Phone, Mail, MapPin } from "lucide-react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ClientActions } from "./_components/client-actions";
import { parseDateFilter } from "@/lib/date-filters";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { UnifiedFilterPanel } from "@/components/dashboard/unified-filter-panel";

interface ClientsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    q?: string;
    range?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function ClientsPage({ params, searchParams }: ClientsPageProps) {
  const { id: boutiqueId } = await params;
  const { q, range, from, to, page: pageStr } = await searchParams;
  
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
    boutiqueId,
  };

  // Date range filter
  if (dateFilter.startDate || dateFilter.endDate) {
    whereClause.createdAt = dateFilter.whereClause;
  }

  // Term search filter
  if (q) {
    whereClause.OR = [
      { nom: { contains: q, mode: "insensitive" } },
      { prenom: { contains: q, mode: "insensitive" } },
      { telephone: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [clients, totalCount] = await Promise.all([
    prisma.client.findMany({
      where: whereClause,
      orderBy: { nom: "asc" },
      skip,
      take: limit,
    }),
    prisma.client.count({
      where: whereClause,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Clients</h1>
          <p className="text-muted-foreground font-medium">Gérez votre base de clients et leur historique.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Button asChild variant="brand" className="flex-1 sm:flex-initial rounded-xl h-12 px-6 font-black shadow-lg shadow-brand/20">
            <Link href={`/boutiques/${boutiqueId}/clients/new`}>
              <Plus className="mr-2 h-5 w-5" />
              Nouveau Client
            </Link>
          </Button>
        </div>
      </div>

      {/* Panel de Filtres (Pleine largeur dans le corps) */}
      <UnifiedFilterPanel
        searchPlaceholder="Rechercher un client..."
      />

      {/* Contenu principal */}
      <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden">
            <CardHeader className="p-8 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-slate-800 dark:text-zinc-200 font-extrabold">
                {q ? `Résultats de recherche pour "${q}"` : "Liste des clients"}
              </div>
              {q && (
                <div className="text-xs text-muted-foreground font-bold">
                  {totalCount} client{totalCount > 1 ? "s" : ""} trouvé{totalCount > 1 ? "s" : ""} pour &quot;{q}&quot;
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
                    <TableRow className="border-none">
                      <TableHead className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Client</TableHead>
                      <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest">Contact</TableHead>
                      <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest">Adresse</TableHead>
                      <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-right px-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.length > 0 ? (
                      clients.map((client) => (
                        <TableRow key={client.id} className="border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors group">
                          <TableCell className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand font-black text-lg">
                                {(client.prenom?.[0] || "") + (client.nom?.[0] || "")}
                              </div>
                              <div>
                                <p className="font-black text-base">{client.prenom} {client.nom}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Client Fidèle</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-6">
                            <div className="space-y-1">
                              {client.telephone && (
                                <div className="flex items-center gap-2 text-sm font-bold">
                                  <Phone className="h-3 w-3 text-emerald-500" />
                                  {client.telephone}
                                </div>
                              )}
                              {client.email && (
                                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                                  <Mail className="h-3 w-3 text-brand" />
                                  {client.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-6">
                            {client.adresse ? (
                              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                                <MapPin className="h-3 w-3 text-amber-500" />
                                {client.adresse}
                              </div>
                            ) : (
                              <span className="text-zinc-300 dark:text-zinc-700 italic text-sm">Non spécifiée</span>
                            )}
                          </TableCell>
                          <TableCell className="px-8 py-6 text-right">
                            <ClientActions
                              clientId={client.id}
                              boutiqueId={boutiqueId}
                              clientNom={`${client.prenom || ""} ${client.nom}`}
                              clientData={{
                                nom: client.nom,
                                prenom: client.prenom,
                                telephone: client.telephone,
                                email: client.email,
                                adresse: client.adresse,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="h-20 w-20 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                              <Users className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-xl font-black">Aucun client trouvé</p>
                              <p className="text-muted-foreground font-medium">
                                {q || range ? "Ajustez vos filtres pour afficher des résultats." : "Commencez par ajouter votre premier client."}
                              </p>
                            </div>
                            {!q && !range && (
                              <Button asChild variant="brand" className="rounded-xl h-12 px-8 font-black">
                                <Link href={`/boutiques/${boutiqueId}/clients/new`}>Ajouter un client</Link>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <SimplePagination
            totalItems={totalCount}
            itemsPerPage={limit}
            currentPage={page}
          />
      </div>
    </div>
  );
}
