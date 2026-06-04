"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, FileText, ChevronRight, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { FACTURE_STATUT_CONFIG } from "@/lib/facture-statut";
import type { FactureStatut } from "@/schemas/facture.schema";

interface FactureRow {
  id: string;
  numero: string;
  date: Date | string;
  statut: FactureStatut;
  clientNom: string | null;
  clientTelephone: string | null;
  total: number;
  stockDeduit: boolean;
  _count: { lignes: number };
}

const FILTERS: { value: "TOUS" | FactureStatut; label: string }[] = [
  { value: "TOUS", label: "Toutes" },
  { value: "BROUILLON", label: "Brouillons" },
  { value: "PAYEE", label: "Payées" },
  { value: "IMPAYEE", label: "Impayées" },
  { value: "ANNULEE", label: "Annulées" },
];

export function FacturesClient({
  boutiqueId,
  factures,
}: {
  boutiqueId: string;
  factures: FactureRow[];
}) {
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState<"TOUS" | FactureStatut>("TOUS");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return factures.filter((f) => {
      if (statut !== "TOUS" && f.statut !== statut) return false;
      if (!q) return true;
      return (
        f.numero.toLowerCase().includes(q) ||
        (f.clientNom ?? "").toLowerCase().includes(q) ||
        (f.clientTelephone ?? "").toLowerCase().includes(q)
      );
    });
  }, [factures, search, statut]);

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un numéro, un client…"
            className="h-12 rounded-2xl bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 pl-11 font-semibold text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatut(f.value)}
              className={cn(
                "shrink-0 px-4 h-9 rounded-full text-xs font-black transition-colors border",
                statut === f.value
                  ? "bg-brand text-white border-brand"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-150 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucune facture"
          description="Créez votre première facture pour vos ventes physiques ou services."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] uppercase tracking-widest text-zinc-500 font-black">
                    <th className="text-left py-3.5 pl-6">Numéro</th>
                    <th className="text-left py-3.5">Date</th>
                    <th className="text-left py-3.5">Client</th>
                    <th className="text-center py-3.5">Statut</th>
                    <th className="text-right py-3.5">Total</th>
                    <th className="py-3.5 pr-6" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f) => {
                    const cfg = FACTURE_STATUT_CONFIG[f.statut];
                    return (
                      <tr key={f.id} className="border-t border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3.5 pl-6 font-black text-zinc-900 dark:text-zinc-100">
                          <Link href={`/boutiques/${boutiqueId}/factures/${f.id}`} className="hover:text-brand">
                            {f.numero}
                          </Link>
                        </td>
                        <td className="py-3.5 text-zinc-500 whitespace-nowrap">{formatDate(f.date)}</td>
                        <td className="py-3.5 font-semibold text-zinc-700 dark:text-zinc-300">{f.clientNom || "—"}</td>
                        <td className="py-3.5 text-center">
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide", cfg.badge)}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-black text-brand whitespace-nowrap">{formatCurrency(f.total)}</td>
                        <td className="py-3.5 pr-6 text-right">
                          <Link href={`/boutiques/${boutiqueId}/factures/${f.id}`} className="inline-flex text-zinc-300 hover:text-brand">
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col gap-3">
            {filtered.map((f) => {
              const cfg = FACTURE_STATUT_CONFIG[f.statut];
              return (
                <Link
                  key={f.id}
                  href={`/boutiques/${boutiqueId}/factures/${f.id}`}
                  className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-4 shadow-sm active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-black text-zinc-900 dark:text-zinc-100 truncate">{f.numero}</p>
                      <p className="text-[11px] font-semibold text-zinc-500 mt-0.5">{formatDate(f.date)}</p>
                    </div>
                    <span className={cn("shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase", cfg.badge)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-end justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">{f.clientNom || "Client occasionnel"}</p>
                      <p className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Package className="h-3 w-3" /> {f._count.lignes} ligne{f._count.lignes > 1 ? "s" : ""}
                      </p>
                    </div>
                    <p className="font-black text-brand whitespace-nowrap">{formatCurrency(f.total)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
