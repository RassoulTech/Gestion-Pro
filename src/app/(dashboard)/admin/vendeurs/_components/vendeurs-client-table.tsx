"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Mail, Calendar, Store, UserCheck, Ban, X, Filter, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { ToggleStatusButton } from "../../_components/toggle-status-button";

interface Vendeur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  statut: "ACTIF" | "SUSPENDU";
  createdAt: Date;
  _count: {
    boutiques: number;
  };
}

interface VendeursClientTableProps {
  initialVendeurs: Vendeur[];
  total: number;
}

const gradients = [
  "from-orange-500 to-orange-600",
  "from-emerald-400 to-teal-600",
  "from-orange-500 to-cyan-600",
  "from-rose-500 to-pink-600",
  "from-orange-400 to-orange-600",
];

function getGradient(name: string) {
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  return gradients[code % gradients.length];
}

export function VendeursClientTable({ initialVendeurs, total }: VendeursClientTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"TOUT" | "ACTIF" | "SUSPENDU">("TOUT");

  const filteredVendeurs = initialVendeurs.filter((v) => {
    const matchesSearch =
      `${v.prenom} ${v.nom}`.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase()) ||
      v.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "TOUT" || v.statut === statusFilter;

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
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400 transition-colors group-focus-within:text-orange-500" />
            <input
              type="text"
              placeholder="Rechercher un vendeur par nom, prenom ou email..."
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
              <Filter className="h-3.5 w-3.5" /> Filtrer par :
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
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                statusFilter === "ACTIF"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" /> Actifs
            </button>
            <button
              onClick={() => setStatusFilter("SUSPENDU")}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                statusFilter === "SUSPENDU"
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <Ban className="h-3.5 w-3.5" /> Suspendus
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {filteredVendeurs.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-zinc-200 bg-white/30 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/15 text-center min-h-[350px]"
          >
            <div className="relative mb-6">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 opacity-20 blur-xl animate-pulse" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                <Users className="h-8 w-8 animate-bounce" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Aucun vendeur trouvé
            </h3>
            <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500 max-w-md mx-auto">
              {search || statusFilter !== "TOUT"
                ? "Ajustez vos critères de filtrage ou modifiez votre terme de recherche pour trouver le vendeur souhaité."
                : "La base de données des vendeurs est actuellement vide. Invitez des marchands à s'inscrire pour démarrer."}
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
              {filteredVendeurs.map((v) => {
                const initials = `${v.prenom.charAt(0)}${v.nom.charAt(0)}`.toUpperCase();
                const avatarGrad = getGradient(v.prenom + v.nom);
                return (
                  <div
                    key={v.id}
                    className="relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/70 p-5 shadow-md backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/70 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGrad} text-white font-black text-sm shadow-md`}>
                          {initials}
                        </div>
                        <div>
                          <span className="block font-extrabold text-zinc-900 dark:text-zinc-50 leading-tight">
                            {v.prenom} {v.nom}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 font-mono">ID: {v.id.slice(0, 8)}</span>
                        </div>
                      </div>
                      <StatusBadge status={v.statut} />
                    </div>

                    <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-900 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 flex items-center gap-1 font-semibold"><Mail className="h-3 w-3" /> Email</span>
                        <span className="font-mono text-zinc-700 dark:text-zinc-300 break-all max-w-[200px] text-right font-semibold">{v.email}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 flex items-center gap-1 font-semibold"><Store className="h-3 w-3" /> Boutiques</span>
                        <span className="font-extrabold text-zinc-800 dark:text-zinc-200">{v._count.boutiques}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 flex items-center gap-1 font-semibold"><Calendar className="h-3 w-3" /> Inscription</span>
                        <span className="font-semibold text-zinc-500 dark:text-zinc-400">{formatDate(v.createdAt)}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                      <ToggleStatusButton id={v.id} currentStatut={v.statut} type="vendeur" />
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
                      <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200 pl-6">Vendeur</TableHead>
                      <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200">
                        <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-zinc-400" /> Email</span>
                      </TableHead>
                      <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200">Statut</TableHead>
                      <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200 text-center">
                        <span className="flex items-center justify-center gap-1.5"><Store className="h-3.5 w-3.5 text-zinc-400" /> Boutiques</span>
                      </TableHead>
                      <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200">
                        <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-zinc-400" /> Inscription</span>
                      </TableHead>
                      <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200 text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendeurs.map((v) => {
                      const initials = `${v.prenom.charAt(0)}${v.nom.charAt(0)}`.toUpperCase();
                      const avatarGrad = getGradient(v.prenom + v.nom);
                      return (
                        <TableRow
                          key={v.id}
                          className="border-b border-zinc-100 hover:bg-orange-500/5 dark:border-zinc-900/60 dark:hover:bg-orange-500/5 transition-all duration-200"
                        >
                          <TableCell className="py-4 font-semibold text-zinc-950 dark:text-zinc-50 pl-6">
                            <div className="flex items-center space-x-3">
                              <div className={`flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGrad} text-white font-black text-xs shadow-md`}>
                                {initials}
                              </div>
                              <div>
                                <span className="block font-extrabold text-zinc-900 dark:text-zinc-50 leading-tight">
                                  {v.prenom} {v.nom}
                                </span>
                                <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">ID: {v.id.slice(0, 8)}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs font-semibold">
                            {v.email}
                          </TableCell>
                          <TableCell className="py-4">
                            <StatusBadge status={v.statut} />
                          </TableCell>
                          <TableCell className="py-4 text-center font-extrabold text-zinc-800 dark:text-zinc-200">
                            <span className="inline-flex items-center justify-center min-w-7 h-5 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-bold">
                              {v._count.boutiques}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-zinc-500 dark:text-zinc-400 text-xs font-bold">
                            {formatDate(v.createdAt)}
                          </TableCell>
                          <TableCell className="py-4 text-right pr-6">
                            <ToggleStatusButton id={v.id} currentStatut={v.statut} type="vendeur" />
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
          Affichage de {filteredVendeurs.length} sur {total} vendeur(s) inscrit(s)
        </p>
      </div>
    </div>
  );
}
