"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CreditCard, Sparkles, Calendar, DollarSign, User, X, Filter } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";

interface Abonnement {
  id: string;
  dateDebut: Date;
  dateFin: Date | null;
  montant: number;
  statut: "ACTIF" | "EXPIRATION_PROCHE" | "EXPIRE" | "ANNULE";
  vendeur: {
    nom: string;
    prenom: string;
  };
  plan: {
    nom: string;
  };
}

interface AbonnementsClientTableProps {
  initialAbonnements: Abonnement[];
}

export function AbonnementsClientTable({ initialAbonnements }: AbonnementsClientTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("TOUT");

  const filteredAbonnements = initialAbonnements.filter((a) => {
    const sellerName = `${a.vendeur.prenom} ${a.vendeur.nom}`.toLowerCase();
    const planName = a.plan.nom.toLowerCase();
    const searchLower = search.toLowerCase();

    const matchesSearch =
      sellerName.includes(searchLower) ||
      planName.includes(searchLower) ||
      a.id.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === "TOUT" || a.statut === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Premium Filter & Search Control Panel */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/50 bg-white/60 p-6 shadow-xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/60 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-orange-600/5 blur-2xl" />
        <div className="absolute -right-12 -bottom-12 h-32 w-32 rounded-full bg-orange-600/5 blur-2xl" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher par marchand, offre ou ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-10 rounded-2xl bg-zinc-100/50 border border-zinc-200/30 text-sm font-semibold placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:bg-zinc-900/50 dark:border-zinc-800/30 dark:text-zinc-50 dark:placeholder-zinc-500 transition-all duration-300"
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

          {/* Status Buttons Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
              <Filter className="h-3.5 w-3.5" /> Statut :
            </span>
            <button
              onClick={() => setStatusFilter("TOUT")}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${
                statusFilter === "TOUT"
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setStatusFilter("ACTIF")}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${
                statusFilter === "ACTIF"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              Actifs
            </button>
            <button
              onClick={() => setStatusFilter("EXPIRE")}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${
                statusFilter === "EXPIRE"
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              Expirés
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {filteredAbonnements.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center p-6 sm:p-12 rounded-3xl border border-dashed border-zinc-200 bg-white/30 backdrop-blur-sm dark:border-dashed dark:border-zinc-800/80 dark:bg-zinc-950/15 text-center min-h-[280px] sm:min-h-[350px]"
          >
            <div className="relative mb-6">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 opacity-20 blur-xl animate-pulse" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                <CreditCard className="h-8 w-8 animate-bounce" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Aucun abonnement trouvé
            </h3>
            <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500 max-w-md mx-auto">
              Ajustez vos critères de filtrage ou modifiez votre terme de recherche pour afficher les abonnements correspondants.
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
            {/* Mobile Cards View */}
            <div className="grid gap-4 md:hidden">
              {filteredAbonnements.map((a) => (
                <div
                  key={a.id}
                  className="relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/70 p-5 shadow-md backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/70 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400 font-semibold shadow-sm border border-orange-100/50 dark:border-orange-900/30">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="block font-extrabold text-zinc-900 dark:text-zinc-50 leading-tight">
                          {a.vendeur.prenom} {a.vendeur.nom}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 font-mono">ID: {a.id.slice(0, 8)}</span>
                      </div>
                    </div>
                    <StatusBadge status={a.statut} />
                  </div>

                  <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-900 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400 flex items-center gap-1 font-semibold"><Sparkles className="h-3 w-3" /> Offre</span>
                      <span className="inline-flex items-center rounded-lg bg-orange-50 dark:bg-orange-950/30 px-2.5 py-1 text-xs font-black text-orange-700 dark:text-orange-400">
                        {a.plan.nom}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400 flex items-center gap-1 font-semibold"><Calendar className="h-3 w-3" /> Début</span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatDate(a.dateDebut)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400 flex items-center gap-1 font-semibold"><Calendar className="h-3 w-3" /> Fin</span>
                      <span className="font-semibold text-zinc-500 dark:text-zinc-400">
                        {a.dateFin ? formatDate(a.dateFin) : <span className="text-zinc-400 font-mono">—</span>}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-900">
                      <span className="text-zinc-400 font-bold">Montant</span>
                      <span className="font-extrabold text-zinc-950 dark:text-zinc-50 text-sm">{formatCurrency(a.montant)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block relative overflow-hidden rounded-3xl border border-zinc-200/60 bg-white/70 shadow-xl backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/70">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50/50 dark:border-zinc-900 dark:bg-zinc-900/40">
                      <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200 pl-6">
                        <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-zinc-400" /> Marchand</span>
                      </TableHead>
                      <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200">
                        <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-zinc-400" /> Offre souscrite</span>
                      </TableHead>
                      <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200">Statut</TableHead>
                      <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200">
                        <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-zinc-400" /> Date Début</span>
                      </TableHead>
                      <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200">
                        <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-zinc-400" /> Date Fin</span>
                      </TableHead>
                      <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200 text-right pr-6">
                        <span className="flex items-center justify-end gap-1.5"><DollarSign className="h-3.5 w-3.5 text-zinc-400" /> Facturation</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAbonnements.map((a) => (
                      <TableRow
                        key={a.id}
                        className="border-b border-zinc-100 hover:bg-orange-500/5 dark:border-zinc-900/60 dark:hover:bg-orange-500/5 transition-all duration-200"
                      >
                        <TableCell className="py-4 font-extrabold text-zinc-950 dark:text-zinc-50 pl-6">
                          {a.vendeur.prenom} {a.vendeur.nom}
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="inline-flex items-center rounded-lg bg-orange-50 dark:bg-orange-950/30 px-2.5 py-1 text-xs font-black text-orange-700 dark:text-orange-400">
                            {a.plan.nom}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <StatusBadge status={a.statut} />
                        </TableCell>
                        <TableCell className="py-4 text-zinc-600 dark:text-zinc-400 text-xs font-bold">
                          {formatDate(a.dateDebut)}
                        </TableCell>
                        <TableCell className="py-4 text-zinc-500 dark:text-zinc-400 text-xs font-bold">
                          {a.dateFin ? formatDate(a.dateFin) : <span className="text-zinc-400 font-mono">—</span>}
                        </TableCell>
                        <TableCell className="py-4 text-right pr-6 font-black text-zinc-950 dark:text-zinc-50 text-sm">
                          {formatCurrency(a.montant)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mt-4 px-2">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">
          Affichage de {filteredAbonnements.length} sur {initialAbonnements.length} abonnement(s)
        </p>
      </div>
    </div>
  );
}
