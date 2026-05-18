import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { CreditCard, User, Sparkles, Calendar, Layers, DollarSign } from "lucide-react";

export const metadata = { title: "Abonnements - Admin" };

export default async function AdminAbonnementsPage() {
  const abonnements = await prisma.abonnement.findMany({
    include: {
      vendeur: { select: { nom: true, prenom: true } },
      plan: { select: { nom: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0 border-b border-zinc-100 pb-6 dark:border-zinc-900">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-violet-50 p-2 dark:bg-violet-950/30">
              <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Abonnements Marchands
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Consultez les souscriptions actives et l&apos;historique de facturation récurrente de vos marchands.
          </p>
        </div>
      </div>

      {/* Mobile Card View (md:hidden) */}
      <div className="grid gap-4 md:hidden">
        {abonnements.length === 0 ? (
          <div className="text-center py-10 text-zinc-400">
            Aucun abonnement enregistré pour le moment.
          </div>
        ) : (
          abonnements.map((a) => (
            <div
              key={a.id}
              className="relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/70"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400 font-semibold shadow-sm border border-violet-100/50 dark:border-violet-900/30">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                      {a.vendeur.prenom} {a.vendeur.nom}
                    </span>
                    <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 font-mono">Abonnement ID: {a.id.slice(0, 8)}</span>
                  </div>
                </div>
                <StatusBadge status={a.statut} />
              </div>

              <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-900 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Plan</span>
                  <span className="inline-flex items-center rounded-lg bg-violet-50 dark:bg-violet-950/30 px-2.5 py-1 text-xs font-bold text-violet-700 dark:text-violet-400">
                    {a.plan.nom}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Début</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatDate(a.dateDebut)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Fin de validité</span>
                  <span className="font-medium text-zinc-500 dark:text-zinc-400">
                    {a.dateFin ? formatDate(a.dateFin) : <span className="text-zinc-400 font-mono">—</span>}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-900">
                  <span className="text-zinc-400 font-bold">Montant</span>
                  <span className="font-extrabold text-zinc-950 dark:text-zinc-50 text-sm">{formatCurrency(a.montant)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (md:block) */}
      <div className="hidden md:block relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/90 shadow-xl shadow-zinc-100/40 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/90 dark:shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50/50 dark:border-zinc-900 dark:bg-zinc-900/40">
                <TableHead className="py-4 font-bold text-zinc-800 dark:text-zinc-200 pl-6">
                  <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-zinc-400" /> Vendeur</span>
                </TableHead>
                <TableHead className="py-4 font-bold text-zinc-800 dark:text-zinc-200">
                  <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-zinc-400" /> Plan</span>
                </TableHead>
                <TableHead className="py-4 font-bold text-zinc-800 dark:text-zinc-200">
                  <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 text-zinc-400" /> Statut</span>
                </TableHead>
                <TableHead className="py-4 font-bold text-zinc-800 dark:text-zinc-200">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-zinc-400" /> Début</span>
                </TableHead>
                <TableHead className="py-4 font-bold text-zinc-800 dark:text-zinc-200">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-zinc-400" /> Fin de validité</span>
                </TableHead>
                <TableHead className="py-4 font-bold text-zinc-800 dark:text-zinc-200 text-right pr-6">
                  <span className="flex items-center justify-end gap-1.5"><DollarSign className="h-3.5 w-3.5 text-zinc-400" /> Montant</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {abonnements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-zinc-400">
                    Aucun abonnement enregistré pour le moment.
                  </TableCell>
                </TableRow>
              ) : (
                abonnements.map((a) => (
                  <TableRow key={a.id} className="border-b border-zinc-100 hover:bg-zinc-50/40 dark:border-zinc-900 dark:hover:bg-zinc-900/30 transition-colors">
                    <TableCell className="py-4 font-bold text-zinc-950 dark:text-zinc-50 pl-6">
                      {a.vendeur.prenom} {a.vendeur.nom}
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="inline-flex items-center rounded-lg bg-violet-50 dark:bg-violet-950/30 px-2.5 py-1 text-xs font-bold text-violet-700 dark:text-violet-400">
                        {a.plan.nom}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <StatusBadge status={a.statut} />
                    </TableCell>
                    <TableCell className="py-4 text-zinc-600 dark:text-zinc-400 text-xs font-semibold">
                      {formatDate(a.dateDebut)}
                    </TableCell>
                    <TableCell className="py-4 text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                      {a.dateFin ? formatDate(a.dateFin) : <span className="text-zinc-400 font-mono">—</span>}
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6 font-extrabold text-zinc-950 dark:text-zinc-50">
                      {formatCurrency(a.montant)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 px-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
          Affichage des {abonnements.length} derniers abonnements
        </p>
      </div>
    </div>
  );
}

