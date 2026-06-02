/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import {
  Plus,
  Package,
  Layers,
  ArrowRightLeft
} from "lucide-react";
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
import { ProduitActions } from "./_components/produit-actions";
import { ExcelImportButton } from "./_components/excel-import-button";
import { parseDateFilter } from "@/lib/date-filters";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { UnifiedFilterPanel } from "@/components/dashboard/unified-filter-panel";
import { PeriodFilterSelect } from "@/components/dashboard/period-filter-select";

interface ProduitsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ 
    q?: string; 
    status?: string; 
    range?: string; 
    from?: string; 
    to?: string; 
    page?: string; 
    category?: string;
    categoryId?: string;
  }>;
}

export default async function ProduitsPage({ params, searchParams }: ProduitsPageProps) {
  const { id: boutiqueId } = await params;
  const { q, status, range, from, to, page: pageStr, category, categoryId } = await searchParams;
  
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN" || session.user.isImpersonating;

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
      { code: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  // Stock status filter
  if (status) {
    if (status === "alert") {
      whereClause.quantite = { lte: 5, gt: 0 };
    } else if (status === "instock") {
      whereClause.quantite = { gt: 5 };
    } else if (status === "outofstock") {
      whereClause.quantite = 0;
    }
  }

  // Category filter
  const targetCategory = category || categoryId;
  if (targetCategory && targetCategory !== "all" && targetCategory !== "ALL") {
    whereClause.categorieId = targetCategory;
  }

  const [
    boutique,
    filteredProduits,
    totalCount,
    lowStockCount,
    outOfStockCount,
    filteredCount,
    categories,
  ] = await Promise.all([
    prisma.boutique.findUnique({
      where: { id: boutiqueId },
      select: { nom: true },
    }),
    prisma.produit.findMany({
      where: whereClause,
      include: {
        categorie: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    // Total count of products
    prisma.produit.count({ where: { boutiqueId } }),
    // Low stock count (quantite <= 5 and > 0)
    prisma.produit.count({ where: { boutiqueId, quantite: { lte: 5, gt: 0 } } }),
    // Out of stock count (quantite == 0)
    prisma.produit.count({ where: { boutiqueId, quantite: 0 } }),
    // Count of filtered products
    prisma.produit.count({ where: whereClause }),
    // Categories list for filter panel
    prisma.categorie.findMany({
      where: { boutiqueId },
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
  ]);

  if (!boutique) notFound();

  return (
    <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12 py-4 sm:py-6 px-4 sm:px-6">
      
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
            <Link href="/boutiques" className="hover:text-orange-500 transition-colors">Mes Boutiques</Link>
            <span>/</span>
            <Link href={`/boutiques/${boutiqueId}`} className="hover:text-orange-500 transition-colors">{boutique.nom}</Link>
            <span>/</span>
            <span className="text-slate-600 dark:text-zinc-300">Inventaire</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800 dark:text-zinc-100 flex items-center gap-3">
            <Package className="w-8 h-8 text-orange-500" />
            Gestion de l&apos;inventaire
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">
            Pilotez vos produits, gérez vos niveaux de stock critique et optimisez vos ventes pour <strong className="text-slate-700 dark:text-zinc-200">{boutique.nom}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-stretch md:self-auto sm:justify-end">
          <PeriodFilterSelect />
          <Button asChild variant="outline" className="flex-1 sm:flex-initial h-12 rounded-xl font-bold border-slate-200 dark:border-zinc-800 text-xs sm:text-sm">
            <Link href={`/boutiques/${boutiqueId}/stock`}>
              <ArrowRightLeft className="mr-2 h-4 w-4 text-slate-500" />
              Mouvements
            </Link>
          </Button>
          {isAdmin && <ExcelImportButton boutiqueId={boutiqueId} />}
          <Button asChild variant="premium" className="flex-1 sm:flex-initial h-12 rounded-xl font-extrabold shadow-lg shadow-orange-500/10 text-xs sm:text-sm">
            <Link href={`/boutiques/${boutiqueId}/produits/new`}>
              <Plus className="mr-2 h-4.5 w-4.5" />
              Nouveau Produit
            </Link>
          </Button>
        </div>
      </div>

      {/* Panel de Filtres (Pleine largeur dans le corps) */}
      <UnifiedFilterPanel
        searchPlaceholder="Rechercher par nom, code barre..."
        categories={categories}
        categoryLabel="Catégorie de produit"
        statusOptions={[
          { value: "all", label: "Tous les produits" },
          { value: "alert", label: "Stock critique" },
          { value: "instock", label: "En stock" },
          { value: "outofstock", label: "Rupture" },
        ]}
        statusLabel="Statut du stock"
      />

      {/* Contenu principal */}
      <div className="space-y-8">
          {/* Modern Dashboard KPI Cards row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-5 space-y-1 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total produits</span>
              <p className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-zinc-100">{totalCount}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-5 space-y-1 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Résultats trouvés</span>
              <p className="text-2xl sm:text-3xl font-black text-orange-500">{filteredCount}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-5 space-y-1 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500">Niveaux critiques</span>
              <p className="text-2xl sm:text-3xl font-black text-rose-500">{lowStockCount}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-5 space-y-1 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Ruptures de stock</span>
              <p className="text-2xl sm:text-3xl font-black text-slate-700 dark:text-zinc-300">{outOfStockCount}</p>
            </div>
          </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2rem] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="relative w-full">
            <TableHeader className="bg-slate-50 dark:bg-zinc-800/50 sticky top-0 z-10 border-b border-slate-100 dark:border-zinc-800">
              <TableRow className="border-none h-14">
                <TableHead className="font-extrabold uppercase tracking-wider text-[10px] text-slate-500 dark:text-zinc-400 pl-8">Produit</TableHead>
                <TableHead className="font-extrabold uppercase tracking-wider text-[10px] text-slate-500 dark:text-zinc-400">Code</TableHead>
                <TableHead className="font-extrabold uppercase tracking-wider text-[10px] text-slate-500 dark:text-zinc-400">Catégorie</TableHead>
                <TableHead className="font-extrabold uppercase tracking-wider text-[10px] text-slate-500 dark:text-zinc-400 text-right">Prix d&apos;Achat</TableHead>
                <TableHead className="font-extrabold uppercase tracking-wider text-[10px] text-slate-500 dark:text-zinc-400 text-right">Prix de Vente</TableHead>
                <TableHead className="font-extrabold uppercase tracking-wider text-[10px] text-slate-500 dark:text-zinc-400 text-center">Stock Actuel</TableHead>
                <TableHead className="font-extrabold uppercase tracking-wider text-[10px] text-slate-500 dark:text-zinc-400 text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProduits.length > 0 ? (
                filteredProduits.map((produit) => (
                  <TableRow 
                    key={produit.id} 
                    className="border-slate-100 dark:border-zinc-800/80 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors h-[68px]"
                  >
                    <TableCell className="pl-8 py-3.5">
                      <div className="flex items-center gap-4.5">
                        <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/50 flex items-center justify-center shrink-0 relative overflow-hidden shadow-inner">
                          {produit.photo ? (
                            <Image 
                              src={produit.photo} 
                              alt={produit.nom} 
                              fill 
                              className="object-cover" 
                              unoptimized 
                            />
                          ) : (
                            <Package className="h-6 w-6 text-slate-400 dark:text-zinc-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-800 dark:text-zinc-100 text-sm truncate max-w-[220px]">{produit.nom}</p>
                          {produit.description && (
                            <p className="text-[11px] text-slate-400 truncate max-w-[220px] mt-0.5">{produit.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded">
                        {produit.code || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {produit.categorie ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-xs font-bold text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20">
                          <Layers className="w-3.5 h-3.5" />
                          {produit.categorie.nom}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-600 dark:text-zinc-400">
                      {produit.prixAchat ? `${produit.prixAchat.toLocaleString()} FCFA` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-black text-orange-600 dark:text-orange-400">
                      {produit.prixUnitaire.toLocaleString()} FCFA
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-black border ${
                        produit.quantite === 0
                          ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                          : produit.quantite <= produit.seuilAlerte
                            ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-500 dark:border-rose-500/20"
                            : "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20"
                      }`}>
                        {produit.quantite === 0 ? "Rupture" : `${produit.quantite} en stock`}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <ProduitActions
                        produitId={produit.id}
                        boutiqueId={boutiqueId}
                        produitNom={produit.nom}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-72 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="h-16 w-16 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-slate-400">
                        <Package className="w-8 h-8" />
                      </div>
                      <h3 className="font-extrabold text-slate-800 dark:text-zinc-200">Aucun produit trouvé</h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                        Ajustez vos filtres de recherche ou créez un nouveau produit pour enrichir l&apos;inventaire.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Stacked Card View (Hidden on desktop) */}
      <div className="md:hidden space-y-4">
        {filteredProduits.length > 0 ? (
          filteredProduits.map((produit) => (
            <div 
              key={produit.id} 
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 space-y-4 shadow-sm relative overflow-hidden"
            >
              {/* Product Header details */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/50 flex items-center justify-center shrink-0 relative overflow-hidden shadow-inner">
                    {produit.photo ? (
                      <Image 
                        src={produit.photo} 
                        alt={produit.nom} 
                        fill 
                        className="object-cover" 
                        unoptimized 
                      />
                    ) : (
                      <Package className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-800 dark:text-zinc-100 text-sm truncate max-w-[170px]">{produit.nom}</h3>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">{produit.code || "Sans code barre"}</p>
                    {produit.categorie && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-500/10 text-[9px] font-bold text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20 mt-1">
                        {produit.categorie.nom}
                      </span>
                    )}
                  </div>
                </div>

                <ProduitActions
                  produitId={produit.id}
                  boutiqueId={boutiqueId}
                  produitNom={produit.nom}
                />
              </div>

              {/* Price details & Stock badge */}
              <div className="pt-3 border-t border-slate-100/50 dark:border-zinc-800/50 flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Prix de Vente</span>
                  <p className="font-black text-sm text-orange-600 dark:text-orange-400">{produit.prixUnitaire.toLocaleString()} FCFA</p>
                </div>
                
                <div>
                  <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-black border ${
                    produit.quantite === 0
                      ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                      : produit.quantite <= produit.seuilAlerte
                        ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-500 dark:border-rose-500/20"
                        : "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20"
                  }`}>
                    {produit.quantite === 0 ? "Rupture" : `${produit.quantite} en stock`}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <div className="h-16 w-16 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-slate-400 mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 dark:text-zinc-200">Aucun produit</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs leading-relaxed mx-auto">
                Ajustez vos filtres de recherche ou créez un nouveau produit pour enrichir votre inventaire.
              </p>
            </div>
          </div>
        )}
      </div>

          <SimplePagination
            totalItems={filteredCount}
            itemsPerPage={limit}
            currentPage={page}
          />
      </div>
    </div>
  );
}
