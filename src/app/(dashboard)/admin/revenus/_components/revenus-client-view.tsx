"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, DollarSign, Search, Calendar, Landmark, CreditCard, ChevronRight, X, Filter } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Paiement {
  id: string;
  montant: number;
  methode: string;
  statut: "EN_ATTENTE" | "CONFIRME" | "ECHOUE" | "REMBOURSE";
  transactionRef: string | null;
  createdAt: Date;
  abonnement: {
    plan: {
      nom: string;
    };
    vendeur: {
      nom: string;
      prenom: string;
    };
  };
}

interface RevenusClientViewProps {
  total: number;
  mensuel: number;
  recentPaiements: Paiement[];
}

export function RevenusClientView({ total, mensuel, recentPaiements }: RevenusClientViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("TOUT");

  const filteredPaiements = recentPaiements.filter((p) => {
    const sellerName = `${p.abonnement.vendeur.prenom} ${p.abonnement.vendeur.nom}`.toLowerCase();
    const planName = p.abonnement.plan.nom.toLowerCase();
    const ref = (p.transactionRef ?? "").toLowerCase();
    const meth = p.methode.toLowerCase();
    const searchLower = search.toLowerCase();

    const matchesSearch =
      sellerName.includes(searchLower) ||
      planName.includes(searchLower) ||
      ref.includes(searchLower) ||
      meth.includes(searchLower) ||
      p.id.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === "TOUT" || p.statut === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (statut: Paiement["statut"]) => {
    switch (statut) {
      case "CONFIRME":
        return (
          <span className="inline-flex items-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 text-xs font-black text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30">
            Confirmé
          </span>
        );
      case "EN_ATTENTE":
        return (
          <span className="inline-flex items-center rounded-lg bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 text-xs font-black text-amber-700 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30">
            En attente
          </span>
        );
      case "ECHOUE":
        return (
          <span className="inline-flex items-center rounded-lg bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 text-xs font-black text-rose-700 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/30">
            Échoué
          </span>
        );
      case "REMBOURSE":
        return (
          <span className="inline-flex items-center rounded-lg bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 text-xs font-black text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700">
            Remboursé
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Cards Section */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Card 1: Total Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -4 }}
          className="relative overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white/90 p-8 shadow-xl backdrop-blur-md dark:border-violet-950/30 dark:from-violet-950/20 dark:to-zinc-950/75"
        >
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-violet-700 dark:text-violet-300">
              Chiffre d&apos;Affaires Cumulé
            </span>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 dark:from-violet-500 dark:to-indigo-500">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-8">
            <h2 className="text-4xl font-black tracking-tight text-violet-950 dark:text-violet-50">
              {formatCurrency(total)}
            </h2>
            <p className="mt-2 text-xs font-bold text-violet-600/80 dark:text-violet-400">
              Volume total des paiements validés depuis le lancement de la plateforme.
            </p>
          </div>
        </motion.div>

        {/* Card 2: Monthly Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -4 }}
          className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white/90 p-8 shadow-xl backdrop-blur-md dark:border-emerald-950/30 dark:from-emerald-950/20 dark:to-zinc-950/75"
        >
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-emerald-600/10 blur-3xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
              Revenus Mensuels
            </span>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 dark:from-emerald-500 dark:to-teal-500">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-8">
            <h2 className="text-4xl font-black tracking-tight text-emerald-950 dark:text-emerald-50">
              {formatCurrency(mensuel)}
            </h2>
            <p className="mt-2 text-xs font-bold text-emerald-600/80 dark:text-emerald-400">
              Montant cumulé des paiements confirmés pour le mois en cours.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Filter and Search Panel */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/50 bg-white/60 p-6 shadow-xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/60">
        <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-violet-600/5 blur-2xl" />
        <div className="absolute -right-12 -bottom-12 h-32 w-32 rounded-full bg-indigo-600/5 blur-2xl" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher par marchand, offre, méthode, réf..."
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

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
              <Filter className="h-3.5 w-3.5" /> Statut :
            </span>
            <button
              onClick={() => setStatusFilter("TOUT")}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${
                statusFilter === "TOUT"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setStatusFilter("CONFIRME")}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${
                statusFilter === "CONFIRME"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              Confirmés
            </button>
            <button
              onClick={() => setStatusFilter("EN_ATTENTE")}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${
                statusFilter === "EN_ATTENTE"
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              En attente
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2 pl-1">
          <Landmark className="h-5 w-5 text-violet-500" /> Flux de Paiements Récents
        </h3>

        <AnimatePresence mode="wait">
          {filteredPaiements.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-zinc-200 bg-white/30 backdrop-blur-sm dark:border-dashed dark:border-zinc-800/80 dark:bg-zinc-950/15 text-center min-h-[300px]"
            >
              <div className="relative mb-5">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 opacity-15 blur-xl animate-pulse" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 shadow-md">
                  <CreditCard className="h-6 w-6" />
                </div>
              </div>
              <h4 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">Aucun paiement trouvé</h4>
              <p className="mt-2 text-sm text-zinc-400 max-w-sm">
                Aucune transaction correspondante n&apos;a été trouvée pour les critères spécifiés.
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
                {filteredPaiements.map((p) => (
                  <div
                    key={p.id}
                    className="relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/70 p-5 shadow-md backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/70"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="block font-extrabold text-zinc-900 dark:text-zinc-50 leading-tight">
                          {p.abonnement.vendeur.prenom} {p.abonnement.vendeur.nom}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mt-0.5">
                          Offre : {p.abonnement.plan.nom}
                        </span>
                      </div>
                      {getStatusBadge(p.statut)}
                    </div>

                    <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-900 text-xs font-bold">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Réf. transaction</span>
                        <span className="font-mono text-zinc-700 dark:text-zinc-300">
                          {p.transactionRef ? p.transactionRef.slice(0, 16) : "Non renseignée"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Méthode</span>
                        <span className="text-zinc-700 dark:text-zinc-300 uppercase">{p.methode}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Date</span>
                        <span className="text-zinc-500 font-semibold">{formatDate(p.createdAt)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-900">
                        <span className="text-zinc-400 font-bold">Montant payé</span>
                        <span className="font-extrabold text-zinc-950 dark:text-zinc-50 text-sm">
                          {formatCurrency(p.montant)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block relative overflow-hidden rounded-3xl border border-zinc-200/60 bg-white/70 shadow-xl backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/70">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50/50 dark:border-zinc-900 dark:bg-zinc-900/40">
                        <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200 pl-6">Marchand</TableHead>
                        <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200">Formule</TableHead>
                        <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200">Méthode</TableHead>
                        <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200">Réf. transaction</TableHead>
                        <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200">Date</TableHead>
                        <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200">Statut</TableHead>
                        <TableHead className="py-4 font-black text-zinc-800 dark:text-zinc-200 text-right pr-6">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPaiements.map((p) => (
                        <TableRow
                          key={p.id}
                          className="border-b border-zinc-100 hover:bg-violet-500/5 dark:border-zinc-900/60 dark:hover:bg-violet-500/5 transition-all duration-200"
                        >
                          <TableCell className="py-4 font-extrabold text-zinc-950 dark:text-zinc-50 pl-6">
                            {p.abonnement.vendeur.prenom} {p.abonnement.vendeur.nom}
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="inline-flex items-center rounded-lg bg-violet-50 dark:bg-violet-950/30 px-2.5 py-1 text-xs font-black text-violet-700 dark:text-violet-400">
                              {p.abonnement.plan.nom}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-xs font-extrabold text-zinc-600 dark:text-zinc-400 uppercase">
                            {p.methode}
                          </TableCell>
                          <TableCell className="py-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                            {p.transactionRef ?? <span className="text-zinc-400">—</span>}
                          </TableCell>
                          <TableCell className="py-4 text-zinc-500 dark:text-zinc-400 text-xs font-bold">
                            {formatDate(p.createdAt)}
                          </TableCell>
                          <TableCell className="py-4">
                            {getStatusBadge(p.statut)}
                          </TableCell>
                          <TableCell className="py-4 text-right pr-6 font-black text-zinc-950 dark:text-zinc-50 text-sm">
                            {formatCurrency(p.montant)}
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
      </div>

      <div className="flex items-center justify-between mt-4 px-2">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">
          Affichage de {filteredPaiements.length} sur {recentPaiements.length} transaction(s)
        </p>
      </div>
    </div>
  );
}
