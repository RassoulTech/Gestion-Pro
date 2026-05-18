import { Suspense } from "react";
import { getAllBoutiques } from "@/server/queries/admin.queries";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { TableSkeleton } from "@/components/loading";
import { ToggleStatusButton } from "../_components/toggle-status-button";

export const metadata = { title: "Boutiques - Admin" };

async function BoutiquesContent() {
  const { data: boutiques, total } = await getAllBoutiques();

  return (
    <>
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 dark:bg-zinc-900/50">
              <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">Boutique</TableHead>
              <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">Vendeur / Propriétaire</TableHead>
              <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">Secteur</TableHead>
              <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">Statut</TableHead>
              <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100 text-center">Produits</TableHead>
              <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">Créée le</TableHead>
              <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {boutiques.map((b) => (
              <TableRow key={b.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                <TableCell className="font-semibold text-zinc-900 dark:text-zinc-50">{b.nom}</TableCell>
                <TableCell className="text-zinc-700 dark:text-zinc-300 font-medium">
                  {b.vendeur.prenom} {b.vendeur.nom}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-zinc-100 text-zinc-800 font-medium dark:bg-zinc-800 dark:text-zinc-200">
                    {b.secteurActivite}
                  </Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge status={b.statut} />
                </TableCell>
                <TableCell className="text-center font-medium text-zinc-600 dark:text-zinc-400">{b._count.produits}</TableCell>
                <TableCell className="text-zinc-500 dark:text-zinc-400 text-xs">{formatDate(b.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <ToggleStatusButton id={b.id} currentStatut={b.statut} type="boutique" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">{total} boutique(s) enregistrée(s)</p>
    </>
  );
}

export default function AdminBoutiquesPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Gestion des Boutiques</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Supervisez et suspendez les boutiques de la plateforme si nécessaire.</p>
      </div>
      <Suspense fallback={<TableSkeleton />}><BoutiquesContent /></Suspense>
    </div>
  );
}
