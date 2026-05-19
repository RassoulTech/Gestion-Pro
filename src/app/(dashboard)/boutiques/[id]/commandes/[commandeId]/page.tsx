import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, Smartphone, Wallet } from "lucide-react";
import { getCommandeById } from "@/server/queries/commande.queries";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { Separator } from "@/components/ui/separator";

const PAYMENT_LABELS: Record<string, { label: string; icon: typeof CreditCard; color: string }> = {
  WAVE: { label: "Wave", icon: Smartphone, color: "text-sky-500" },
  ORANGE_MONEY: { label: "Orange Money", icon: Smartphone, color: "text-orange-500" },
  STRIPE: { label: "Carte bancaire (Stripe)", icon: CreditCard, color: "text-indigo-500" },
  PAYPAL: { label: "PayPal", icon: CreditCard, color: "text-blue-500" },
  CASH_ON_DELIVERY: { label: "Paiement à la livraison", icon: Wallet, color: "text-emerald-500" },
};

const PAYMENT_STATUS: Record<string, { label: string; tone: string }> = {
  EN_ATTENTE: { label: "En attente", tone: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  CONFIRME: { label: "Confirmé", tone: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  ECHOUE: { label: "Échoué", tone: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  REMBOURSE: { label: "Remboursé", tone: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20" },
};

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
                  {commande.client.adresse && <p className="text-muted-foreground">{commande.client.adresse}</p>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Client non renseigné</p>
              )}
            </CardContent>
          </Card>

          {(commande.modePaiement || commande.statutPaiement) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Paiement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {commande.modePaiement && (() => {
                  const pay = PAYMENT_LABELS[commande.modePaiement];
                  const Icon = pay?.icon ?? CreditCard;
                  return (
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${pay?.color ?? "text-muted-foreground"}`} />
                      <span className="font-medium">{pay?.label ?? commande.modePaiement}</span>
                    </div>
                  );
                })()}
                {commande.statutPaiement && (() => {
                  const status = PAYMENT_STATUS[commande.statutPaiement];
                  return (
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${status?.tone ?? ""}`}>
                      {status?.label ?? commande.statutPaiement}
                    </span>
                  );
                })()}
              </CardContent>
            </Card>
          )}

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
