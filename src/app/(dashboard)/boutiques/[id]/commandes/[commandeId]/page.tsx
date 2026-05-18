import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCommandeById } from "@/server/queries/commande.queries";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { Separator } from "@/components/ui/separator";

export const metadata = { title: "Détail commande" };

export default async function CommandeDetailPage({
  params,
}: {
  params: Promise<{ id: string; commandeId: string }>;
}) {
  const { id: boutiqueId, commandeId } = await params;
  const commande = await getCommandeById(boutiqueId, commandeId);

  if (!commande) notFound();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/boutiques/${boutiqueId}/commandes`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Commande {commande.code}</h1>
          <p className="text-sm text-muted-foreground">{formatDateTime(commande.date)}</p>
        </div>
        <StatusBadge status={commande.etat} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Prix unit.</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead className="text-right">Sous-total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commande.lignes.map((ligne) => (
                  <TableRow key={ligne.id}>
                    <TableCell className="font-medium">{ligne.produit.nom}</TableCell>
                    <TableCell className="text-muted-foreground">{ligne.produit.code}</TableCell>
                    <TableCell className="text-right">{formatCurrency(ligne.prixUnitaire)}</TableCell>
                    <TableCell className="text-right">{ligne.quantite}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(ligne.prixUnitaire * ligne.quantite)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Separator className="my-4" />
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{formatCurrency(commande.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client</CardTitle>
            </CardHeader>
            <CardContent>
              {commande.client ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{commande.client.nom} {commande.client.prenom}</p>
                  {commande.client.telephone && <p className="text-muted-foreground">{commande.client.telephone}</p>}
                  {commande.client.email && <p className="text-muted-foreground">{commande.client.email}</p>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Client non renseigné</p>
              )}
            </CardContent>
          </Card>

          {commande.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{commande.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
