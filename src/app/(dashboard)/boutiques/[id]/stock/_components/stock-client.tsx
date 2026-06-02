"use client";

import React, { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Package,
  SlidersHorizontal,
  Calendar,
  Hash,
  Database,
  Loader2,
} from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  total: number;
  totalEntrees: number;
  totalSorties: number;
  /** Valeurs `sourceType` réellement présentes en base pour cette boutique. */
  availableSources: string[];
}

/**
 * Normalise un `sourceType` brut (toutes conventions historiques + actuelles)
 * vers un libellé lisible. Tolère les variantes de casse et de nommage
 * (COMMANDE / CommandeClient / VENTE, etc.).
 */
function getSourceLabel(sourceType: string | null): string {
  if (!sourceType) return "Manuel";
  switch (sourceType.toUpperCase()) {
    case "VENTE":
    case "COMMANDE":
    case "COMMANDE_CLIENT":
    case "COMMANDECLIENT":
      return "Vente client";
    case "ACHAT":
    case "COMMANDE_FOURNISSEUR":
    case "COMMANDEFOURNISSEUR":
      return "Réapprovisionnement";
    case "VENTE_FLASH":
    case "VENTEFLASH":
      return "Vente flash";
    case "AJUSTEMENT":
      return "Ajustement de stock";
    case "INITIAL":
      return "Stock initial";
    case "CREATION":
      return "Création produit";
    case "ANNULATIONCOMMANDE":
      return "Annulation commande";
    case "REACTIVATIONCOMMANDE":
      return "Réactivation commande";
    default:
      return sourceType;
  }
}

export function StockClient({ mouvements, total, totalEntrees, totalSorties, availableSources }: StockClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const search = searchParams.get("q") || "";
  const typeFilter = searchParams.get("type") || "ALL";
  const sourceFilter = searchParams.get("source") || "ALL";

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) params.set("q", term);
    else params.delete("q");
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const handleTypeChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val && val !== "ALL") params.set("type", val);
    else params.delete("type");
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const handleSourceChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val && val !== "ALL") params.set("source", val);
    else params.delete("source");
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
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
            <p className="text-2xl font-black">{total}</p>
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
                defaultValue={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-none font-bold focus:ring-2 focus:ring-brand w-full"
              />
              {isPending && (
                <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Select Type */}
            <div className="w-full lg:w-48">
              <Select value={typeFilter} onValueChange={handleTypeChange}>
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
              <Select value={sourceFilter} onValueChange={handleSourceChange}>
                <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-none font-bold focus:ring-2 focus:ring-brand">
                  <SelectValue placeholder="Source de mouvement" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="ALL">Toutes les sources</SelectItem>
                  {availableSources.map((src) => (
                    <SelectItem key={src} value={src}>
                      {getSourceLabel(src)}
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
                    {mouvements.map((m, index) => {
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

                  {mouvements.length === 0 && (
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
        {mouvements.length > 0 ? (
          mouvements.map((m) => {
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
    </div>
  );
}
