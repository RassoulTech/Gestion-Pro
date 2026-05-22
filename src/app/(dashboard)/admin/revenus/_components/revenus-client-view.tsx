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
          className="relative overflow-hidden rounded-3xl border border-slate-200/50 bg-gradient-to-br from-slate-50/80 to-white/90 p-8 shadow-xl backdrop-blur-md dark:border-white/10 dark:from-slate-900/50 dark:to-slate-950/75"
        >
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Chiffre d&apos;Affaires Cumulé
            </span>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30 dark:from-orange-400 dark:to-amber-500">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-8">
            <h2 className="text-4xl font-black tracking-tight text-slate-950 dark:text-slate-50">
              {formatCurrency(total)}
            </h2>
            <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
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
          className="relative overflow-hidden rounded-3xl border border-slate-200/50 bg-gradient-to-br from-slate-50/80 to-white/90 p-8 shadow-xl backdrop-blur-md dark:border-white/10 dark:from-slate-900/50 dark:to-slate-950/75"
        >
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Revenus Mensuels
            </span>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30 dark:from-orange-400 dark:to-rose-400">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-8">
            <h2 className="text-4xl font-black tracking-tight text-slate-950 dark:text-slate-50">
              {formatCurrency(mensuel)}
            </h2>
            <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              Montant cumulé des paiements confirmés pour le mois en cours.
            </p>
          </div>
        </motion.div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-slate-200/50 bg-white/60 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50">
        <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl" />
        <div className="absolute -right-12 -bottom-12 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-orange-500" />
            <input
              type="text"
              placeholder="Rechercher par marchand, offre, méthode, réf..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-10 rounded-2xl bg-slate-100/50 border border-slate-200/30 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:bg-slate-800/50 dark:border-slate-700/30 dark:text-slate-50 dark:placeholder-slate-500 transition-all duration-300"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-3 h-5 w-5 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
              <Filter className="h-3.5 w-3.5" /> Statut :
            </span>
            <button
              onClick={() => setStatusFilter("TOUT")}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${
                statusFilter === "TOUT"
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setStatusFilter("CONFIRME")}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${
                statusFilter === "CONFIRME"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              Confirmés
            </button>
            <button
              onClick={() => setStatusFilter("EN_ATTENTE")}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${
                statusFilter === "EN_ATTENTE"
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              En attente
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2 pl-1">
          <Landmark className="h-5 w-5 text-orange-500" /> Flux de Paiements Récents
        </h3>

        <AnimatePresence mode="wait">
          {filteredPaiements.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-slate-200 bg-white/30 backdrop-blur-sm dark:border-dashed dark:border-slate-800/80 dark:bg-slate-900/15 text-center min-h-[300px]"
            >
              <div className="relative mb-5">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-orange-500 to-orange-500 opacity-20 blur-xl animate-pulse" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 shadow-md">
                  <CreditCard className="h-6 w-6" />
                </div>
              </div>
              <h4 className="text-lg font-extrabold text-slate-900 dark:text-slate-50">Aucun paiement trouvé</h4>
              <p className="mt-2 text-sm text-slate-400 max-w-sm">
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
                    className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/70 p-5 shadow-md backdrop-blur-md dark:border-white/10 dark:bg-slate-900/50 hover:shadow-lg hover:border-orange-500/30 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="block font-extrabold text-slate-900 dark:text-slate-50 leading-tight">
                          {p.abonnement.vendeur.prenom} {p.abonnement.vendeur.nom}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                          Offre : {p.abonnement.plan.nom}
                        </span>
                      </div>
                      {getStatusBadge(p.statut)}
                    </div>

                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800 text-xs font-bold">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Réf. transaction</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {p.transactionRef ? p.transactionRef.slice(0, 16) : "Non renseignée"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Méthode</span>
                        <span className="text-slate-700 dark:text-slate-300 uppercase">{p.methode}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Date</span>
                        <span className="text-slate-500 font-semibold">{formatDate(p.createdAt)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 font-bold">Montant payé</span>
                        <span className="font-extrabold text-slate-950 dark:text-slate-50 text-sm">
                          {formatCurrency(p.montant)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-200/50 bg-slate-50/50 hover:bg-slate-50/50 dark:border-slate-800/50 dark:bg-slate-800/40">
                        <TableHead className="py-4 font-black text-slate-800 dark:text-slate-200 pl-6">Marchand</TableHead>
                        <TableHead className="py-4 font-black text-slate-800 dark:text-slate-200">Formule</TableHead>
                        <TableHead className="py-4 font-black text-slate-800 dark:text-slate-200">Méthode</TableHead>
                        <TableHead className="py-4 font-black text-slate-800 dark:text-slate-200">Réf. transaction</TableHead>
                        <TableHead className="py-4 font-black text-slate-800 dark:text-slate-200">Date</TableHead>
                        <TableHead className="py-4 font-black text-slate-800 dark:text-slate-200">Statut</TableHead>
                        <TableHead className="py-4 font-black text-slate-800 dark:text-slate-200 text-right pr-6">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPaiements.map((p) => (
                        <TableRow
                          key={p.id}
                          className="border-b border-slate-100 hover:bg-orange-500/5 dark:border-slate-800/50 dark:hover:bg-orange-500/10 transition-all duration-200"
                        >
                          <TableCell className="py-4 font-extrabold text-slate-950 dark:text-slate-50 pl-6">
                            {p.abonnement.vendeur.prenom} {p.abonnement.vendeur.nom}
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="inline-flex items-center rounded-lg bg-orange-50 dark:bg-orange-950/30 px-2.5 py-1 text-xs font-black text-orange-700 dark:text-orange-400 border border-orange-100/50 dark:border-orange-900/30">
                              {p.abonnement.plan.nom}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase">
                            {p.methode}
                          </TableCell>
                          <TableCell className="py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                            {p.transactionRef ?? <span className="text-slate-400">—</span>}
                          </TableCell>
                          <TableCell className="py-4 text-slate-500 dark:text-slate-400 text-xs font-bold">
                            {formatDate(p.createdAt)}
                          </TableCell>
                          <TableCell className="py-4">
                            {getStatusBadge(p.statut)}
                          </TableCell>
                          <TableCell className="py-4 text-right pr-6 font-black text-slate-950 dark:text-slate-50 text-sm">
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
        <p className="text-xs text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">
          Affichage de {filteredPaiements.length} sur {recentPaiements.length} transaction(s)
        </p>
      </div>
    </div>
  );
}
