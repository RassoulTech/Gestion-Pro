import { Suspense } from "react";
import { Truck, FileText } from "lucide-react";
import { getBoutiqueCommandesFournisseur } from "@/server/queries/commande.queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { TableSkeleton } from "@/components/loading";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Commandes fournisseur" };

async function CommandesFournisseurContent({ boutiqueId }: { boutiqueId: string }) {
  const { data: commandes } = await getBoutiqueCommandesFournisseur(boutiqueId);

  if (commandes.length === 0) {
    return <EmptyState icon={Truck} title="Aucune commande fournisseur" description="Les achats fournisseur apparaîtront ici." />;
  }

  return (
    <Card className="border-none shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50 dark:bg-zinc-800/50">
                <TableHead className="font-black uppercase text-[10px] tracking-widest pl-4 sm:pl-6">Code</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest hidden sm:table-cell">Date</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest hidden md:table-cell">Fournisseur</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Total</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest pr-4 sm:pr-6">État</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commandes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium pl-4 sm:pl-6">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <span>{c.code}</span>
                        <span className="block text-[10px] text-muted-foreground sm:hidden">{formatDate(c.date)}</span>
                        <span className="block text-[10px] text-muted-foreground md:hidden sm:block">{c.fournisseur.nom}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell whitespace-nowrap">{formatDate(c.date)}</TableCell>
                  <TableCell className="hidden md:table-cell">{c.fournisseur.nom}</TableCell>
                  <TableCell className="text-right font-semibold whitespace-nowrap">{formatCurrency(c.total)}</TableCell>
                  <TableCell className="pr-4 sm:pr-6"><StatusBadge status={c.etat} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function CommandesFournisseurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-5 sm:space-y-8 pb-6 sm:pb-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Achats fournisseur</h1>
        <p className="text-muted-foreground font-medium">Gérez vos commandes fournisseur</p>
      </div>
      <Suspense fallback={<TableSkeleton />}><CommandesFournisseurContent boutiqueId={id} /></Suspense>
    </div>
  );
}
