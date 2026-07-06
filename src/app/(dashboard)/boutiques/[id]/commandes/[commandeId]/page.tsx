import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { ArrowLeft, CreditCard, Wallet, Mail, Phone, MapPin } from "lucide-react";
import { WaveIcon, OrangeMoneyIcon } from "@/components/icons/brand-icons";
import { getCommandeById } from "@/server/queries/commande.queries";
import { getBoutiqueById } from "@/server/queries/boutique.queries";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { Separator } from "@/components/ui/separator";
import { EtatActions } from "./_components/etat-actions";
import { FactureCommandeButtons } from "./_components/facture-commande-buttons";

// `color` ne s'applique qu'aux icônes de ligne (Lucide) ; les logos de marque
// Wave / Orange Money portent déjà leurs couleurs officielles.
const PAYMENT_LABELS: Record<
  string,
  { label: string; icon: ComponentType<{ className?: string } & Partial<SVGProps<SVGSVGElement>>>; color: string; brand?: boolean }
> = {
  WAVE: { label: "Wave", icon: WaveIcon, color: "", brand: true },
  ORANGE_MONEY: { label: "Orange Money", icon: OrangeMoneyIcon, color: "", brand: true },
  CASH_ON_DELIVERY: { label: "Paiement à la livraison", icon: Wallet, color: "text-emerald-500" },
};

const PAYMENT_STATUS: Record<string, { label: string; tone: string }> = {
  EN_ATTENTE: { label: "En attente", tone: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  CONFIRME: { label: "Confirmé", tone: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  ECHOUE: { label: "Échoué", tone: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  REMBOURSE: { label: "Remboursé", tone: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20" },
};

export const metadata: Metadata = { title: "Détail commande" };

export default async function CommandeDetailPage({
  params,
}: {
  params: Promise<{ id: string; commandeId: string }>;
}) {
  const { id: boutiqueId, commandeId } = await params;
  const [commande, boutique] = await Promise.all([
    getCommandeById(boutiqueId, commandeId),
    getBoutiqueById(boutiqueId),
  ]);

  if (!commande || !boutique) notFound();

  return (
    <div className="space-y-5 sm:space-y-6 p-3 sm:p-6">
      {/* Header — stack on mobile, inline on desktop */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href={`/boutiques/${boutiqueId}/commandes`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
              Commande {commande.code}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{formatDateTime(commande.date)}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:ml-auto sm:flex-row sm:items-center">
          <StatusBadge status={commande.etat} />
          <FactureCommandeButtons
            boutiqueId={boutiqueId}
            commandeId={commandeId}
            boutique={{
              nom: boutique.nom,
              logo: boutique.logo,
              telephone: boutique.telephone,
              email: boutique.email,
              adresse: boutique.adresse,
              factureSettings: boutique.factureSettings,
            }}
            commande={{
              code: commande.code,
              date: commande.date.toISOString(),
              invoiceNumber: commande.invoiceNumber,
              statutPaiement: commande.statutPaiement,
              modePaiement: commande.modePaiement,
              remise: commande.remise,
              total: commande.total,
              notes: commande.notes,
              client: commande.client
                ? {
                    nom: commande.client.nom,
                    prenom: commande.client.prenom,
                    telephone: commande.client.telephone,
                    email: commande.client.email,
                    adresse: commande.client.adresse,
                  }
                : null,
              lignes: commande.lignes.map((ligne) => ({
                nom: ligne.produit.nom,
                quantite: ligne.quantite,
                prixUnitaire: ligne.prixUnitaire,
              })),
            }}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-3">
        {/* Articles — mobile-first: card list, then table on sm+ */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Articles ({commande.lignes.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {/* Mobile card list */}
            <ul className="space-y-3 sm:hidden">
              {commande.lignes.map((ligne) => (
                <li key={ligne.id} className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{ligne.produit.nom}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{ligne.produit.code}</p>
                    </div>
                    <p className="text-sm font-black text-brand whitespace-nowrap">
                      {formatCurrency(ligne.prixUnitaire * ligne.quantite)}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {ligne.quantite} × {formatCurrency(ligne.prixUnitaire)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
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
                      <TableCell className="text-muted-foreground font-mono text-xs">{ligne.produit.code}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{formatCurrency(ligne.prixUnitaire)}</TableCell>
                      <TableCell className="text-right">{ligne.quantite}</TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap">
                        {formatCurrency(ligne.prixUnitaire * ligne.quantite)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Separator className="my-4" />
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <p className="text-sm text-muted-foreground sm:hidden">Total</p>
              <div className="text-right">
                <p className="hidden sm:block text-sm text-muted-foreground">Total</p>
                <p className="text-xl sm:text-2xl font-bold">{formatCurrency(commande.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side cards */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Client</CardTitle>
            </CardHeader>
            <CardContent>
              {commande.client ? (
                <div className="space-y-3 text-sm">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 break-words flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    {commande.client.nom} {commande.client.prenom}
                  </p>
                  {commande.client.telephone && (
                    <a
                      href={`tel:${commande.client.telephone.replace(/\s+/g, "")}`}
                      className="flex items-center gap-2.5 text-muted-foreground hover:text-orange-600 transition-colors break-words group"
                    >
                      <Phone className="h-4 w-4 text-zinc-400 group-hover:text-orange-600 shrink-0" strokeWidth={1.5} />
                      <span className="font-medium">{commande.client.telephone}</span>
                    </a>
                  )}
                  {commande.client.email && (
                    <a
                      href={`mailto:${commande.client.email}`}
                      className="flex items-center gap-2.5 text-muted-foreground hover:text-orange-600 transition-colors break-words group"
                    >
                      <Mail className="h-4 w-4 text-zinc-400 group-hover:text-orange-600 shrink-0" strokeWidth={1.5} />
                      <span className="font-medium">{commande.client.email}</span>
                    </a>
                  )}
                  {commande.client.adresse && (
                    <div className="flex items-start gap-2.5 text-muted-foreground break-words">
                      <MapPin className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" strokeWidth={1.5} />
                      <span className="font-medium">{commande.client.adresse}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Client non renseigné</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Statut de la commande</CardTitle>
            </CardHeader>
            <CardContent>
              <EtatActions
                boutiqueId={boutiqueId}
                commandeId={commande.id}
                currentEtat={commande.etat}
              />
            </CardContent>
          </Card>

          {(commande.modePaiement || commande.statutPaiement) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Paiement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {commande.modePaiement && (() => {
                  const pay = PAYMENT_LABELS[commande.modePaiement];
                  const Icon = pay?.icon ?? CreditCard;
                  return (
                    <div className="flex items-center gap-2">
                      <Icon
                        className={
                          pay?.brand
                            ? "h-5 w-5 shrink-0 rounded"
                            : `h-4 w-4 shrink-0 ${pay?.color ?? "text-muted-foreground"}`
                        }
                      />
                      <span className="font-medium truncate">{pay?.label ?? commande.modePaiement}</span>
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
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                  {commande.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
