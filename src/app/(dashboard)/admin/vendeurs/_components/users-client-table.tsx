"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Mail, Calendar, X, Filter, Users, Shield } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  vendeur: {
    id: string;
    statut: string;
  } | null;
}

interface UsersClientTableProps {
  initialUsers: User[];
  total: number;
}

const gradients = [
  "from-cyan-500 to-blue-600",
  "from-violet-500 to-indigo-600",
  "from-fuchsia-500 to-pink-600",
  "from-blue-400 to-cyan-600",
  "from-indigo-400 to-violet-600",
];

function getGradient(name: string) {
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  return gradients[code % gradients.length];
}

export function UsersClientTable({ initialUsers, total }: UsersClientTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"TOUT" | "CLIENT" | "VENDEUR">("TOUT");

  const filteredUsers = initialUsers.filter((u) => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "TOUT" || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Search Control Panel */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/50 bg-white/60 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl" />
        <div className="absolute -right-12 -bottom-12 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />
        
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-cyan-500" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-10 rounded-2xl bg-slate-100/50 border border-slate-200/30 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:bg-slate-800/50 dark:border-slate-700/30 dark:text-slate-50 dark:placeholder-slate-500 transition-all duration-300"
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

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
              <Filter className="h-3.5 w-3.5" /> Filtrer par :
            </span>
            <button
              onClick={() => setRoleFilter("TOUT")}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${
                roleFilter === "TOUT"
                  ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setRoleFilter("CLIENT")}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${
                roleFilter === "CLIENT"
                  ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              Client
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {filteredUsers.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-slate-300 bg-white/30 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/30 text-center min-h-[350px]"
          >
            <div className="relative mb-6">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 opacity-20 blur-xl animate-pulse" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg">
                <Users className="h-8 w-8 animate-bounce" />
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white">
              Aucun utilisateur trouvé
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Essayez de modifier vos filtres ou d&apos;ajouter un nouvel utilisateur.
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
            {/* Desktop Table View */}
            <div className="hidden md:block relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-200/50 bg-slate-50/50 hover:bg-slate-50/50 dark:border-slate-800/50 dark:bg-slate-800/40">
                      <TableHead className="py-4 font-black text-slate-800 dark:text-slate-200 pl-6">Utilisateur</TableHead>
                      <TableHead className="py-4 font-black text-slate-800 dark:text-slate-200">
                        <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" /> Email</span>
                      </TableHead>
                      <TableHead className="py-4 font-black text-slate-800 dark:text-slate-200">Rôle</TableHead>
                      <TableHead className="py-4 font-black text-slate-800 dark:text-slate-200">
                        <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" /> Inscription</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => {
                      const displayName = u.name || "Inconnu";
                      const initials = displayName.substring(0, 2).toUpperCase();
                      const avatarGrad = getGradient(displayName);
                      return (
                        <TableRow
                          key={u.id}
                          className="border-b border-slate-100 hover:bg-cyan-500/5 dark:border-slate-800/50 dark:hover:bg-cyan-500/10 transition-all duration-200"
                        >
                          <TableCell className="py-4 font-semibold text-slate-950 dark:text-slate-50 pl-6">
                            <div className="flex items-center space-x-3">
                              <div className={`flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGrad} text-white font-black text-xs shadow-md`}>
                                {initials}
                              </div>
                              <div>
                                <span className="block font-extrabold text-slate-900 dark:text-slate-50 leading-tight">
                                  {displayName}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">ID: {u.id.slice(0, 8)}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-slate-600 dark:text-slate-400 font-mono text-xs font-semibold">
                            {u.email}
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant="outline" className="rounded-lg text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50">
                              <Shield className="h-3 w-3 mr-1.5 text-slate-400" />
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 text-slate-500 dark:text-slate-400 text-xs font-bold">
                            {formatDate(u.createdAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Mobile View */}
            <div className="grid gap-4 md:hidden">
              {filteredUsers.map((u) => {
                const displayName = u.name || "Inconnu";
                const initials = displayName.substring(0, 2).toUpperCase();
                const avatarGrad = getGradient(displayName);
                return (
                  <div
                    key={u.id}
                    className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/70 p-5 shadow-md backdrop-blur-md dark:border-white/10 dark:bg-slate-900/50 hover:shadow-lg hover:border-cyan-500/30 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGrad} text-white font-black text-sm shadow-md`}>
                          {initials}
                        </div>
                        <div>
                          <span className="block font-extrabold text-slate-900 dark:text-slate-50 leading-tight">
                            {displayName}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono">ID: {u.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 flex items-center gap-1 font-semibold"><Mail className="h-3 w-3" /> Email</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 break-all max-w-[200px] text-right font-semibold">{u.email}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 flex items-center gap-1 font-semibold"><Shield className="h-3 w-3" /> Rôle</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{u.role}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 flex items-center gap-1 font-semibold"><Calendar className="h-3 w-3" /> Inscription</span>
                        <span className="font-semibold text-slate-500 dark:text-slate-400">{formatDate(u.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mt-4 px-2">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">
          Affichage de {filteredUsers.length} sur {total} utilisateur(s) sans boutique
        </p>
      </div>
    </div>
  );
}
