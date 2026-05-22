"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Package,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Calendar,
  Hash,
  Database,
} from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";

interface Mouvement {
  id: string;
  type: "ENTREE" | "SORTIE";
  quantite: number;
  sourceType: string | null;
  sourceId: string | null;
  date: Date;
  produit: {
    nom: string;
    code: string;
  };
}

interface StockClientProps {
  mouvements: Mouvement[];
}

export function StockClient({ mouvements }: StockClientProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Extract all unique source types for the dropdown filter
  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    mouvements.forEach((m) => {
      if (m.sourceType) sources.add(m.sourceType);
    });
    return Array.from(sources);
  }, [mouvements]);

  // Filter movements based on search query, type, and source type
  const filteredMouvements = useMemo(() => {
    return mouvements.filter((m) => {
      const matchSearch =
        m.produit.nom.toLowerCase().includes(search.toLowerCase()) ||
        m.produit.code.toLowerCase().includes(search.toLowerCase()) ||
        (m.sourceType && m.sourceType.toLowerCase().includes(search.toLowerCase()));

      const matchType = typeFilter === "ALL" || m.type === typeFilter;
      const matchSource = sourceFilter === "ALL" || m.sourceType === sourceFilter;

      return matchSearch && matchType && matchSource;
    });
  }, [mouvements, search, typeFilter, sourceFilter]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, sourceFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredMouvements.length / itemsPerPage) || 1;
  const paginatedMouvements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMouvements.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMouvements, currentPage]);

  const totalEntrees = useMemo(() => {
    return filteredMouvements
      .filter((m) => m.type === "ENTREE")
      .reduce((sum, m) => sum + m.quantite, 0);
  }, [filteredMouvements]);

  const totalSorties = useMemo(() => {
    return filteredMouvements
      .filter((m) => m.type === "SORTIE")
      .reduce((sum, m) => sum + m.quantite, 0);
  }, [filteredMouvements]);

  const getSourceLabel = (sourceType: string | null) => {
    if (!sourceType) return "Manuel";
    switch (sourceType.toUpperCase()) {
      case "VENTE":
      case "COMMANDE_CLIENT":
        return "Vente Client";
      case "ACHAT":
      case "COMMANDE_FOURNISSEUR":
        return "Réapprovisionnement";
      case "VENTE_FLASH":
        return "Vente Flash";
      case "AJUSTEMENT":
        return "Ajustement de stock";
      default:
        return sourceType;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick stats ribbon */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <Card className="border-none shadow-md bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500 shrink-0">
            <ArrowUpRight className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Entrées</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">+{totalEntrees}</p>
          </div>
        </Card>

        <Card className="border-none shadow-md bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500 shrink-0">
            <ArrowDownLeft className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Sorties</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">-{totalSorties}</p>
          </div>
        </Card>

        <Card className="col-span-2 md:col-span-1 border-none shadow-md bg-zinc-900 dark:bg-zinc-800 text-white rounded-3xl overflow-hidden p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-brand shrink-0">
            <SlidersHorizontal className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Mouvements Filtrés</p>
            <p className="text-2xl font-black">{filteredMouvements.length} / {mouvements.length}</p>
          </div>
        </Card>
      </div>

      {/* Advanced Filters Card */}
      <Card className="border-none shadow-lg bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par produit, SKU ou source..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-none font-bold focus:ring-2 focus:ring-brand w-full"
              />
            </div>

            {/* Select Type */}
            <div className="w-full lg:w-48">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-none font-bold focus:ring-2 focus:ring-brand">
                  <SelectValue placeholder="Type de mouvement" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="ALL">Tous les types</SelectItem>
                  <SelectItem value="ENTREE">Entrées</SelectItem>
                  <SelectItem value="SORTIE">Sorties</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Select Source */}
            <div className="w-full lg:w-56">
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-none font-bold focus:ring-2 focus:ring-brand">
                  <SelectValue placeholder="Source de mouvement" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="ALL">Toutes les sources</SelectItem>
                  {uniqueSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {getSourceLabel(source)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Desktop Stock Movements Table */}
      <div className="hidden sm:block">
        <Card className="border-none shadow-xl rounded-[2rem] bg-white dark:bg-zinc-900 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50/50 dark:bg-zinc-800/30 border-none">
                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest pl-8">Date & Heure</TableHead>
                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest pl-4">Produit / SKU</TableHead>
                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-center">Mouvement</TableHead>
                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-right">Quantité</TableHead>
                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-right pr-8">Source d&apos;origine</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {paginatedMouvements.map((m, index) => {
                      const isEntree = m.type === "ENTREE";
                      return (
                        <motion.tr
                          key={m.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.2, delay: index * 0.02 }}
                          className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors border-none"
                        >
                          {/* Date Cell */}
                          <TableCell className="pl-8 py-5 whitespace-nowrap text-sm text-muted-foreground font-semibold">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-zinc-400 group-hover:text-brand transition-colors" />
                              <span>{formatDateTime(m.date)}</span>
                            </div>
                          </TableCell>

                          {/* Product Cell */}
                          <TableCell className="pl-4 py-5 font-bold">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 shrink-0 group-hover:scale-110 transition-transform">
                                <Package className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-extrabold text-zinc-950 dark:text-white truncate block">{m.produit.nom}</span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Hash className="h-3 w-3" /> {m.produit.code}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Type Cell */}
                          <TableCell className="py-5 text-center">
                            <Badge
                              className={`rounded-xl px-3.5 py-1.5 font-black uppercase text-[10px] tracking-wider border border-transparent shadow-sm inline-flex items-center gap-1.5 ${
                                isEntree
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isEntree ? "bg-emerald-500" : "bg-rose-500"}`} />
                              {isEntree ? "Entrée" : "Sortie"}
                            </Badge>
                          </TableCell>

                          {/* Quantity Cell */}
                          <TableCell className="py-5 text-right font-black text-lg">
                            <span className={isEntree ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                              {isEntree ? "+" : "-"}
                              {m.quantite}
                            </span>
                          </TableCell>

                          {/* Source Cell */}
                          <TableCell className="py-5 text-right pr-8 whitespace-nowrap">
                            <div className="inline-flex items-center gap-2 bg-zinc-100/70 dark:bg-zinc-800/70 px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-zinc-700 dark:text-zinc-300">
                              <Database className="h-3.5 w-3.5 text-zinc-400" />
                              {getSourceLabel(m.sourceType)}
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>

                  {filteredMouvements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                            <Search className="h-6 w-6" />
                          </div>
                          <p className="text-muted-foreground font-black">Aucun mouvement de stock ne correspond à vos filtres.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="sm:hidden flex flex-col gap-4">
        {paginatedMouvements.length > 0 ? (
          paginatedMouvements.map((m) => {
            const isEntree = m.type === "ENTREE";

            return (
              <div key={m.id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 shrink-0">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">{m.produit.nom}</h3>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Hash className="h-3 w-3" /> {m.produit.code}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`rounded-xl px-2.5 py-1 font-black uppercase text-[9px] tracking-wider border border-transparent shadow-sm inline-flex items-center gap-1.5 ${
                      isEntree
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isEntree ? "bg-emerald-500" : "bg-rose-500"}`} />
                    {isEntree ? "Entrée" : "Sortie"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Quantité</span>
                    <span className={cn("font-black text-lg", isEntree ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                      {isEntree ? "+" : "-"}{m.quantite}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Source</span>
                    <div className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-extrabold text-zinc-700 dark:text-zinc-300">
                      <Database className="h-3 w-3 text-zinc-400" />
                      {getSourceLabel(m.sourceType)}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1.5 mt-1">
                  <Calendar className="h-3 w-3" />
                  {formatDateTime(m.date)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="h-16 w-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 mx-auto">
              <Search className="w-8 h-8" />
            </div>
            <p className="text-muted-foreground font-black text-sm">Aucun mouvement ne correspond à vos filtres.</p>
          </div>
        )}
      </div>

          {/* Premium Pagination controls */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-zinc-50/50 dark:bg-zinc-800/10">
              <p className="text-sm font-bold text-muted-foreground text-center sm:text-left">
                Affichage de <span className="font-extrabold text-zinc-950 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> à{" "}
                <span className="font-extrabold text-zinc-950 dark:text-white">
                  {Math.min(currentPage * itemsPerPage, filteredMouvements.length)}
                </span>{" "}
                sur <span className="font-extrabold text-zinc-950 dark:text-white">{filteredMouvements.length}</span> mouvements
              </p>

              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-10 w-10 rounded-xl font-bold border-zinc-200 dark:border-zinc-700 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                    className={`h-10 w-10 rounded-xl font-extrabold border-zinc-200 dark:border-zinc-700 ${
                      currentPage === page
                        ? "bg-brand hover:bg-brand/90 text-white border-transparent"
                        : "hover:bg-zinc-100/50"
                    }`}
                  >
                    {page}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-10 w-10 rounded-xl font-bold border-zinc-200 dark:border-zinc-700 disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
    </div>
  );
}
