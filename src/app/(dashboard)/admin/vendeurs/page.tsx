import { Suspense } from "react";
import { getAllVendeurs } from "@/server/queries/admin.queries";
import { formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { TableSkeleton } from "@/components/loading";
import { ToggleStatusButton } from "../_components/toggle-status-button";

export const metadata = { title: "Vendeurs - Admin" };

async function VendeursContent() {
  const { data: vendeurs, total } = await getAllVendeurs();

  return (
    <>
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 dark:bg-zinc-900/50">
              <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">Vendeur</TableHead>
              <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">Email</TableHead>
              <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">Statut</TableHead>
              <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100 text-center">Boutiques</TableHead>
              <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">Inscription</TableHead>
              <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendeurs.map((v) => (
              <TableRow key={v.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                <TableCell className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {v.prenom} {v.nom}
                </TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-400 font-mono text-xs">{v.email}</TableCell>
                <TableCell>
                  <StatusBadge status={v.statut} />
                </TableCell>
                <TableCell className="text-center font-medium text-zinc-700 dark:text-zinc-300">{v._count.boutiques}</TableCell>
                <TableCell className="text-zinc-500 dark:text-zinc-400 text-xs">{formatDate(v.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <ToggleStatusButton id={v.id} currentStatut={v.statut} type="vendeur" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">{total} vendeur(s) au total</p>
    </>
  );
}

export default function AdminVendeursPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Gestion des Vendeurs</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Gérez le statut des marchands et examinez leur activité.</p>
      </div>
      <Suspense fallback={<TableSkeleton />}><VendeursContent /></Suspense>
    </div>
  );
}
