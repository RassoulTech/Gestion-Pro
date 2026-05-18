"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Store, User, Tag, Layers, Package, Calendar, X, Filter, Sparkles, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { ToggleStatusButton } from "../../_components/toggle-status-button";
import { Badge } from "@/components/ui/badge";

interface Boutique {
  id: string;
  nom: string;
  secteurActivite: string;
  statut: "ACTIF" | "SUSPENDU";
  createdAt: Date;
  vendeur: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  _count: {
    produits: number;
  };
}

interface BoutiquesClientTableProps {
  initialBoutiques: Boutique[];
  total: number;
}

function getSectorColor(sector: string) {
  const normalized = sector.toLowerCase();
  if (normalized.includes("mode") || normalized.includes("habillement") || normalized.includes("fashion")) {
    return "bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900/50";
  }
  if (normalized.includes("tech") || normalized.includes("électronique") || normalized.includes("phone")) {
    return "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50";
  }
  if (normalized.includes("aliment") || normalized.includes("restau") || normalized.includes("nourriture")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50";
  }
  if (normalized.includes("beauté") || normalized.includes("cosmé") || normalized.includes("soin")) {
    return "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50";
  }
  if (normalized.includes("santé")) {
    return "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50";
  }
  if (normalized.includes("quincaillerie")) {
    return "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/50";
  }
  if (normalized.includes("librairie")) {
    return "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50";
  }
  return "bg-zinc-50 text-zinc-700 border-zinc-100 dark:bg-zinc-900/60 dark:text-zinc-300 dark:border-zinc-800/80";
}

const SECTEURS_LIST = [
  { value: "TOUT", label: "Tous les secteurs" },
  { value: "ALIMENTATION", label: "Alimentation" },
  { value: "HABILLEMENT", label: "Mode & Habillement" },
  { value: "ELECTRONIQUE", label: "Électronique" },
  { value: "BEAUTE", label: "Beauté" },
  { value: "SANTE", label: "Santé" },
  { value: "SERVICES", label: "Services" },
  { value: "QUINCAILLERIE", label: "Quincaillerie" },
  { value: "LIBRAIRIE", label: "Librairie" },
];

export function BoutiquesClientTable({ initialBoutiques, total }: BoutiquesClientTableProps) {
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("TOUT");
  const [statusFilter, setStatusFilter] = useState<"TOUT" | "ACTIF" | "SUSPENDU">("TOUT");

  const filteredBoutiques = initialBoutiques.filter((b) => {
    const matchesSearch =
      b.nom.toLowerCase().includes(search.toLowerCase()) ||
      `${b.vendeur.prenom} ${b.vendeur.nom}`.toLowerCase().includes(search.toLowerCase()) ||
      b.vendeur.email.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase());

    const matchesSector = sectorFilter === "TOUT" || b.secteurActivite === sectorFilter;
    const matchesStatus = statusFilter === "TOUT" || b.statut === statusFilter;

    return matchesSearch && matchesSector && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Premium Filter & Search Control Panel */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/50 bg-white/60 p-6 shadow-xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/60 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-violet-600/5 blur-2xl" />
        <div className="absolute -right-12 -bottom-12 h-32 w-32 rounded-full bg-indigo-600/5 blur-2xl" />

        <div className="relative flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher une boutique par nom, marchand ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-11 pr-10 rounded-2xl bg-zinc-100/50 border border-zinc-200/30 text-sm font-semibold placeholder-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 dark:bg-zinc-900/50 dark:border-zinc-800/30 dark:text-zinc-50 dark:placeholder-zinc-500 transition-all duration-300"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-3 h-5 w-5 flex items-center justify-center rounded-full bg-zinc-200 text-zinc-500 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Status Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider hidden md:inline">Statut :</span>
              <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
                <button
                  onClick={() => setStatusFilter("TOUT")}
                  className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === "TOUT"
                      ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  Tout
                </button>
                <button
                  onClick={() => setStatusFilter("ACTIF")}
                  className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === "ACTIF"
                      ? "bg-white text-emerald-600 shadow-sm dark:bg-zinc-800 dark:text-emerald-400"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  Actives
                </button>
                <button
                  onClick={() => setStatusFilter("SUSPENDU")}
                  className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === "SUSPENDU"
                      ? "bg-white text-rose-600 shadow-sm dark:bg-zinc-800 dark:text-rose-400"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  Suspendues
                </button>
              </div>
            </div>
          </div>

          {/* Sector Carousel Filters */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Secteur d&apos;activité :
            </span>
            <div className="flex flex-wrap gap-2">
              {SECTEURS_LIST.map((sect) => (
                <button
                  key={sect.value}
                  onClick={() => setSectorFilter(sect.value)}
                  className={`h-8 px-3 rounded-xl text-xs font-bold transition-all ${
                    sectorFilter === sect.value
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  {sect.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {filteredBoutiques.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-zinc-200 bg-white/30 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/15 text-center min-h-[350px]"
          >
            <div className="relative mb-6">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 opacity-20 blur-xl animate-pulse" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg">
                <Store className="h-8 w-8 animate-bounce" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Aucune boutique trouvée
            </h3>
            <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500 max-w-md mx-auto">
              {search || sectorFilter !== "TOUT" || statusFilter !== "TOUT"
                ? "Ajustez vos critères de filtrage ou modifiez votre terme de recherche pour trouver la boutique souhaitée."
                : "La base de données des boutiques est actuellement vide. Les marchands n'ont créé aucune boutique pour le moment."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Mobile View */}
            <div className="grid gap-4 md:hidden">
              {filteredBoutiques.map((b) => {
                const badgeStyle = getSectorColor(b.secteurActivite);
                return (
                  <div
                    key={b.id}
                    className="relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/70 p-5 shadow-md backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/70 hover:shadow-lg transition-all duration-300 animate-in fade-in duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400 font-semibold shadow-sm border border-violet-100/50 dark:border-violet-900/30">
                          <Store className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="block font-extrabold text-zinc-900 dark:text-zinc-50 leading-tight">
                            {b.nom}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 font-mono">ID: {b.id.slice(0, 8)}</span>
                        </div>
                      </div>
                      <StatusBadge status={b.statut} />
                    </div>

                    <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-900 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 flex items-center gap-1 font-semibold"><User className="h-3 w-3" /> Propriétaire</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{b.vendeur.prenom} {b.vendeur.nom}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 flex items-center gap-1 font-semibold"><Tag className="h-3 w-3" /> Secteur</span>
                        <Badge variant="outline" className={`font-semibold px-2 py-0.5 rounded-lg border text-[10px] ${badgeStyle}`}>
                          {b.secteurActivite}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 flex items-center gap-1 font-semibold"><Package className="h-3 w-3" /> Produits</span>
                        <span className="font-extrabold text-zinc-800 dark:text-zinc-200">{b._count.produits}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 flex items-center gap-1 font-semibold"><Calendar className="h-3 w-3" /> Créée le</span>
                        <span className="font-semibold text-zinc-500 dark:text-zinc-400">{formatDate(b.createdAt)}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                      <ToggleStatusButton id={b.id} currentStatut={b.statut} type="boutique" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block relative overflow-hidden rounded-3xl border border-zinc-200/60 bg-white/70 shadow-xl backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/70">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50/50 dark:border-zinc-900 dark:bg-zinc-900/40">
                      <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200 pl-6">Boutique</TableHead>
                      <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200">
                        <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-zinc-400" /> Propriétaire</span>
                      </TableHead>
                      <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200">
                        <span className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-zinc-400" /> Secteur</span>
                      </TableHead>
                      <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200">Statut</TableHead>
                      <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200 text-center">
                        <span className="flex items-center justify-center gap-1.5"><Package className="h-3.5 w-3.5 text-zinc-400" /> Produits</span>
                      </TableHead>
                      <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200">
                        <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-zinc-400" /> Créée le</span>
                      </TableHead>
                      <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200 text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBoutiques.map((b) => {
                      const badgeStyle = getSectorColor(b.secteurActivite);
                      return (
                        <TableRow
                          key={b.id}
                          className="border-b border-zinc-100 hover:bg-violet-500/5 dark:border-zinc-900/60 dark:hover:bg-violet-500/5 transition-all duration-200"
                        >
                          <TableCell className="py-4 font-semibold text-zinc-950 dark:text-zinc-50 pl-6">
                            <div className="flex items-center space-x-3.5">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400 font-semibold shadow-sm border border-violet-100/50 dark:border-violet-900/30">
                                <Store className="h-5 w-5" />
                              </div>
                              <div>
                                <span className="block font-extrabold text-zinc-900 dark:text-zinc-50 leading-tight">
                                  {b.nom}
                                </span>
                                <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 font-mono">ID: {b.id.slice(0, 8)}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 font-semibold text-zinc-950 dark:text-zinc-50 pl-2">
                            <div>
                              <span className="block text-sm text-zinc-800 dark:text-zinc-200">{b.vendeur.prenom} {b.vendeur.nom}</span>
                              <span className="block font-mono text-[10px] text-zinc-400 dark:text-zinc-500">{b.vendeur.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant="outline" className={`font-black px-2.5 py-0.5 rounded-lg border text-[11px] ${badgeStyle}`}>
                              {b.secteurActivite}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <StatusBadge status={b.statut} />
                          </TableCell>
                          <TableCell className="py-4 text-center font-extrabold text-zinc-800 dark:text-zinc-200">
                            <span className="inline-flex items-center justify-center min-w-7 h-5 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-bold">
                              {b._count.produits}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-zinc-500 dark:text-zinc-400 text-xs font-bold">
                            {formatDate(b.createdAt)}
                          </TableCell>
                          <TableCell className="py-4 text-right pr-6">
                            <ToggleStatusButton id={b.id} currentStatut={b.statut} type="boutique" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mt-4 px-2">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">
          Affichage de {filteredBoutiques.length} sur {total} boutique(s) active(s)
        </p>
      </div>
    </div>
  );
}
