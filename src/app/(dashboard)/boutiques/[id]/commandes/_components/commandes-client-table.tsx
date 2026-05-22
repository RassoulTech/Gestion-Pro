"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  ShoppingCart,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Eye,
  MoreHorizontal,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { updateEtatCommande } from "@/server/actions/commande.actions";

type Etat = "EN_ATTENTE" | "VALIDEE" | "LIVREE" | "ANNULEE";

export interface CommandeRow {
  id: string;
  code: string;
  date: string; // ISO
  total: number;
  etat: Etat;
  lignesCount: number;
  client: { prenom: string | null; nom: string } | null;
}

const statusMap: Record<Etat, { label: string; icon: typeof Clock; color: string; selectColor: string }> = {
  EN_ATTENTE: {
    label: "En attente",
    icon: Clock,
    color: "text-amber-600 bg-amber-500/10 border-amber-500/30",
    selectColor: "text-amber-700 dark:text-amber-300",
  },
  VALIDEE: {
    label: "Validée",
    icon: CheckCircle2,
    color: "text-orange-600 bg-orange-500/10 border-orange-500/30",
    selectColor: "text-orange-700 dark:text-orange-300",
  },
  LIVREE: {
    label: "Livrée",
    icon: Truck,
    color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30",
    selectColor: "text-emerald-700 dark:text-emerald-300",
  },
  ANNULEE: {
    label: "Annulée",
    icon: XCircle,
    color: "text-rose-600 bg-rose-500/10 border-rose-500/30",
    selectColor: "text-rose-700 dark:text-rose-300",
  },
};

const STATUS_FILTERS: Array<{ value: "ALL" | Etat; label: string }> = [
  { value: "ALL", label: "Tous les statuts" },
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "VALIDEE", label: "Validée" },
  { value: "LIVREE", label: "Livrée" },
  { value: "ANNULEE", label: "Annulée" },
];

function clientLabel(c: CommandeRow["client"]) {
  if (!c) return "Client de passage";
  return `${c.prenom ?? ""} ${c.nom}`.trim() || "Client de passage";
}

export function CommandesClientTable({
  boutiqueId,
  commandes,
}: {
  boutiqueId: string;
  commandes: CommandeRow[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Etat>("ALL");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return commandes.filter((cmd) => {
      if (statusFilter !== "ALL" && cmd.etat !== statusFilter) return false;
      if (!q) return true;
      const haystack = `${cmd.code} ${clientLabel(cmd.client)}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [commandes, search, statusFilter]);

  async function handleStatusChange(commande: CommandeRow, nextEtat: Etat) {
    if (nextEtat === commande.etat) return;
    setPendingId(commande.id);
    try {
      const result = await updateEtatCommande({
        boutiqueId,
        commandeId: commande.id,
        data: { etat: nextEtat },
      });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success(`Statut mis à jour : ${statusMap[nextEtat].label}`);
      startTransition(() => router.refresh());
    } catch {
      toast.error("Erreur réseau lors du changement de statut.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par code ou client..."
            className="pl-10 h-11 sm:h-12 rounded-xl bg-card border-none shadow-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="h-11 sm:h-12 w-full sm:w-56 rounded-xl bg-card border-none shadow-sm font-bold text-sm">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="font-bold">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active filter summary */}
      {(search || statusFilter !== "ALL") && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-bold">
            {filtered.length} commande{filtered.length > 1 ? "s" : ""} sur {commandes.length}
          </span>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("ALL");
            }}
            className="font-bold text-brand hover:underline"
          >
            Réinitialiser
          </button>
        </div>
      )}

      {/* Desktop Orders Table */}
      <div className="hidden sm:block rounded-[1.5rem] sm:rounded-[2rem] bg-card/50 shadow-2xl backdrop-blur-md overflow-hidden border-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-100/50 dark:bg-zinc-800/50">
              <TableRow className="border-none">
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground pl-4 sm:pl-8">Commande</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground hidden sm:table-cell">Client</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground text-center hidden md:table-cell">Articles</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right">Total</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground text-center min-w-[170px]">Statut</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right pr-4 sm:pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((commande) => {
                  const status = statusMap[commande.etat];
                  const isPending = pendingId === commande.id;
                  return (
                    <TableRow
                      key={commande.id}
                      className="border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100/30 dark:hover:bg-zinc-800/30"
                    >
                      <TableCell className="pl-4 sm:pl-8 py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-brand" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs sm:text-sm">{commande.code}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(commande.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm truncate max-w-[160px]">
                            {clientLabel(commande.client)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold hidden md:table-cell">
                        {commande.lignesCount}
                      </TableCell>
                      <TableCell className="text-right font-black text-brand whitespace-nowrap text-xs sm:text-sm">
                        {commande.total.toLocaleString()} FCFA
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-2">
                          {isPending && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                          )}
                          <Select
                            value={commande.etat}
                            onValueChange={(v) => handleStatusChange(commande, v as Etat)}
                            disabled={isPending}
                          >
                            <SelectTrigger
                              className={cn(
                                "h-8 w-[150px] rounded-full px-3 text-[11px] font-black uppercase tracking-wider border shadow-none",
                                status.color
                              )}
                            >
                              <span className="flex items-center gap-1.5">
                                <status.icon className="h-3 w-3" />
                                <SelectValue />
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              {(["EN_ATTENTE", "VALIDEE", "LIVREE", "ANNULEE"] as Etat[]).map((etat) => {
                                const meta = statusMap[etat];
                                const Icon = meta.icon;
                                return (
                                  <SelectItem
                                    key={etat}
                                    value={etat}
                                    className={cn("font-bold text-xs", meta.selectColor)}
                                  >
                                    <span className="inline-flex items-center gap-2">
                                      <Icon className="h-3.5 w-3.5" />
                                      {meta.label}
                                    </span>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-4 sm:pr-8">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-brand/10 hover:text-brand">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                              <Link href={`/boutiques/${boutiqueId}/commandes/${commande.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> Détails
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center py-20">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 rounded-full bg-zinc-100 p-3 dark:bg-zinc-800">
                        <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-bold">
                        {commandes.length === 0 ? "Aucune commande" : "Aucun résultat"}
                      </p>
                      <p className="text-muted-foreground">
                        {commandes.length === 0
                          ? "Enregistrez votre première vente pour voir l'historique."
                          : "Ajustez les filtres pour afficher plus de commandes."}
                      </p>
                      {commandes.length === 0 && (
                        <Button asChild variant="brand" className="mt-6 rounded-xl font-bold">
                          <Link href={`/boutiques/${boutiqueId}/commandes/new`}>Nouvelle vente</Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="sm:hidden flex flex-col gap-4">
        {filtered.length > 0 ? (
          filtered.map((commande) => {
            const status = statusMap[commande.etat];
            const isPending = pendingId === commande.id;

            return (
              <div key={commande.id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">{commande.code}</h3>
                      <p className="text-[10px] text-zinc-500 font-semibold">{new Date(commande.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-brand/10 hover:text-brand">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link href={`/boutiques/${boutiqueId}/commandes/${commande.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> Détails
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Client : <span className="text-zinc-900 dark:text-zinc-200">{clientLabel(commande.client)}</span>
                </div>
                
                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total</span>
                    <span className="font-black text-brand text-sm">{commande.total.toLocaleString()} FCFA</span>
                  </div>

                  <div className="inline-flex items-center gap-2">
                    {isPending && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                    <Select
                      value={commande.etat}
                      onValueChange={(v) => handleStatusChange(commande, v as Etat)}
                      disabled={isPending}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-8 w-auto min-w-[120px] rounded-full px-3 text-[10px] font-black uppercase tracking-wider border shadow-none",
                          status.color
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          <status.icon className="h-3 w-3" />
                          <SelectValue />
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {(["EN_ATTENTE", "VALIDEE", "LIVREE", "ANNULEE"] as Etat[]).map((etat) => {
                          const meta = statusMap[etat];
                          const Icon = meta.icon;
                          return (
                            <SelectItem
                              key={etat}
                              value={etat}
                              className={cn("font-bold text-xs", meta.selectColor)}
                            >
                              <span className="inline-flex items-center gap-2">
                                <Icon className="h-3 w-3" />
                                {meta.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="h-16 w-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 mx-auto">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-zinc-800 dark:text-zinc-200">
                {commandes.length === 0 ? "Aucune commande" : "Aucun résultat"}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed mx-auto">
                {commandes.length === 0
                  ? "Enregistrez votre première vente pour voir l'historique."
                  : "Ajustez les filtres pour afficher plus de commandes."}
              </p>
            </div>
            {commandes.length === 0 && (
              <Button asChild variant="brand" className="mt-2 rounded-xl font-bold w-full">
                <Link href={`/boutiques/${boutiqueId}/commandes/new`}>Nouvelle vente</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
