"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, Network, ShieldAlert, Cpu, Database, Eye, Activity, X, Filter, ChevronDown, Terminal, Monitor } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Log {
  id: string;
  action: string;
  subjectType: string | null;
  subjectId: string | null;
  changes: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  } | null;
}

interface LogsClientViewProps {
  initialLogs: Log[];
  total: number;
}

function getActionIcon(action: string) {
  const normalized = action.toLowerCase();
  if (normalized.includes("login") || normalized.includes("connexion")) {
    return { icon: User, color: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30 border-orange-200/50 dark:border-orange-900/30" };
  }
  if (normalized.includes("create") || normalized.includes("add") || normalized.includes("ajout")) {
    return { icon: Database, color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-900/30" };
  }
  if (normalized.includes("delete") || normalized.includes("remove") || normalized.includes("supprim")) {
    return { icon: ShieldAlert, color: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30 border-rose-200/50 dark:border-rose-900/30" };
  }
  if (normalized.includes("update") || normalized.includes("edit") || normalized.includes("modif")) {
    return { icon: Cpu, color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-900/30" };
  }
  return { icon: Activity, color: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30 border-orange-200/50 dark:border-orange-900/30" };
}

export function LogsClientView({ initialLogs, total }: LogsClientViewProps) {
  const [search, setSearch] = useState("");
  const [actionCategory, setActionCategory] = useState<string>("TOUT");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = initialLogs.filter((log) => {
    const actionLower = log.action.toLowerCase();
    const triggerName = (log.user?.name ?? "").toLowerCase();
    const triggerEmail = (log.user?.email ?? "").toLowerCase();
    const subject = (log.subjectType ?? "").toLowerCase();
    const ip = (log.ipAddress ?? "").toLowerCase();
    const userAgent = (log.userAgent ?? "").toLowerCase();
    const searchLower = search.toLowerCase();

    const matchesSearch =
      actionLower.includes(searchLower) ||
      triggerName.includes(searchLower) ||
      triggerEmail.includes(searchLower) ||
      subject.includes(searchLower) ||
      ip.includes(searchLower) ||
      userAgent.includes(searchLower) ||
      log.id.toLowerCase().includes(searchLower);

    let matchesCategory = true;
    if (actionCategory === "CONNEXION") {
      matchesCategory = actionLower.includes("login") || actionLower.includes("connexion");
    } else if (actionCategory === "CREATION") {
      matchesCategory = actionLower.includes("create") || actionLower.includes("add") || actionLower.includes("ajout");
    } else if (actionCategory === "MODIFICATION") {
      matchesCategory = actionLower.includes("update") || actionLower.includes("edit") || actionLower.includes("modif");
    } else if (actionCategory === "SUPPRESSION") {
      matchesCategory = actionLower.includes("delete") || actionLower.includes("remove") || actionLower.includes("supprim");
    }

    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Premium Filter Dashboard Bar */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/50 bg-white/60 p-6 shadow-xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/60 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-orange-600/5 blur-2xl" />
        <div className="absolute -right-12 -bottom-12 h-32 w-32 rounded-full bg-orange-600/5 blur-2xl" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher par action, marchand, email, IP, agent..."
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

          {/* Action category filter buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
              <Filter className="h-3.5 w-3.5" /> Type :
            </span>
            <button
              onClick={() => setActionCategory("TOUT")}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                actionCategory === "TOUT"
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setActionCategory("CONNEXION")}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                actionCategory === "CONNEXION"
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              Connexions
            </button>
            <button
              onClick={() => setActionCategory("CREATION")}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                actionCategory === "CREATION"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              Créations
            </button>
            <button
              onClick={() => setActionCategory("MODIFICATION")}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                actionCategory === "MODIFICATION"
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              Modifs
            </button>
            <button
              onClick={() => setActionCategory("SUPPRESSION")}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                actionCategory === "SUPPRESSION"
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              Suppressions
            </button>
          </div>
        </div>
      </div>

      {/* Audit Timeline Section */}
      <div className="relative border-l border-zinc-200/60 ml-4 pl-8 space-y-6 dark:border-zinc-800/80">
        <AnimatePresence mode="wait">
          {filteredLogs.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-zinc-200 bg-white/30 backdrop-blur-sm dark:border-dashed dark:border-zinc-800/80 dark:bg-zinc-950/15 text-center min-h-[300px]"
            >
              <div className="relative mb-5">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 opacity-15 blur-xl animate-pulse" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 shadow-md">
                  <Activity className="h-6 w-6" />
                </div>
              </div>
              <h4 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">Aucun log trouvé</h4>
              <p className="mt-2 text-sm text-zinc-400 max-w-sm">
                Aucune trace d&apos;activité n&apos;est disponible pour les filtres sélectionnés.
              </p>
            </motion.div>
          ) : (
            filteredLogs.map((log, index) => {
              const audit = getActionIcon(log.action);
              const AuditIcon = audit.icon;
              const isExpanded = expandedLogId === log.id;

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                  className="relative group"
                >
                  {/* Bubble Timeline node dot icon */}
                  <div className={`absolute -left-[49px] top-1 flex h-10 w-10 items-center justify-center rounded-xl border shadow-md backdrop-blur-md dark:bg-zinc-950 ${audit.color} transition-all duration-300 group-hover:scale-110`}>
                    <AuditIcon className="h-4.5 w-4.5" />
                  </div>

                  {/* Card wrapper */}
                  <div
                    onClick={() => toggleExpand(log.id)}
                    className="cursor-pointer rounded-3xl border border-zinc-200/50 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/70 transition-all duration-300 hover:shadow-lg hover:bg-white/95 dark:hover:bg-zinc-950/95"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
                            {log.action}
                          </span>
                          <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-lg border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                            {log.subjectType || "Système"}
                          </Badge>
                        </div>
                        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
                          Par : <span className="font-extrabold text-zinc-700 dark:text-zinc-300">{log.user?.name || log.user?.email || "Système"}</span>
                        </p>
                      </div>

                      <div className="text-left sm:text-right space-y-1.5 shrink-0">
                        <p className="text-xs font-mono font-black text-zinc-400 dark:text-zinc-500">
                          {formatDateTime(log.createdAt)}
                        </p>
                        <div className="flex items-center sm:justify-end gap-2">
                          {log.ipAddress && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-md">
                              <Network className="h-2.5 w-2.5" /> {log.ipAddress}
                            </span>
                          )}
                          <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                        </div>
                      </div>
                    </div>

                    {/* Unfoldable JSON detail block or additional information */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900 space-y-3 cursor-default"
                        >
                          {log.subjectId && (
                            <div className="flex items-center gap-2 rounded-xl bg-zinc-100/40 p-2.5 dark:bg-zinc-900/30 border border-zinc-200/10">
                              <Eye className="h-4 w-4 text-zinc-400 shrink-0" />
                              <span className="text-[10px] font-mono text-zinc-400 block truncate">
                                ID de l&apos;élément cible : <span className="font-black text-zinc-700 dark:text-zinc-300">{log.subjectId}</span>
                              </span>
                            </div>
                          )}

                          {log.userAgent && (
                            <div className="flex items-center gap-2 rounded-xl bg-zinc-100/40 p-2.5 dark:bg-zinc-900/30 border border-zinc-200/10">
                              <Monitor className="h-4 w-4 text-zinc-400 shrink-0" />
                              <span className="text-[10px] font-mono text-zinc-400 block truncate">
                                Agent utilisateur : <span className="font-black text-zinc-700 dark:text-zinc-300">{log.userAgent}</span>
                              </span>
                            </div>
                          )}

                          {log.changes != null && (
                            <div className="rounded-2xl border border-zinc-200/40 bg-zinc-950 p-4 font-mono text-xs text-zinc-200 shadow-inner">
                              <div className="flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-2 border-b border-zinc-900 pb-1.5">
                                <Terminal className="h-3 w-3" /> Données de la modification (Payload)
                              </div>
                              <pre className="overflow-x-auto text-[10px] leading-relaxed select-all">
                                {JSON.stringify(log.changes, null, 2)}
                              </pre>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between mt-8 pl-12">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">
          Affichage de {filteredLogs.length} sur {initialLogs.length} trace(s) (Total base: {total})
        </p>
      </div>
    </div>
  );
}
