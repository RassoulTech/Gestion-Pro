import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";

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
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Abonnements</h1>
        <p className="text-sm text-muted-foreground">Tous les abonnements</p>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendeur</TableHead><TableHead>Plan</TableHead><TableHead>Statut</TableHead>
              <TableHead>Début</TableHead><TableHead>Fin</TableHead><TableHead className="text-right">Montant</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {abonnements.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.vendeur.nom} {a.vendeur.prenom}</TableCell>
                <TableCell>{a.plan.nom}</TableCell>
                <TableCell><StatusBadge status={a.statut} /></TableCell>
                <TableCell>{formatDate(a.dateDebut)}</TableCell>
                <TableCell>{a.dateFin ? formatDate(a.dateFin) : "—"}</TableCell>
                <TableCell className="text-right">{formatCurrency(a.montant)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
