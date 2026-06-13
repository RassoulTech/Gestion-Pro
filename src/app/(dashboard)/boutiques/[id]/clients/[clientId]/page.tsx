import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Plus,
  ShoppingCart,
  Wallet,
  CalendarClock,
} from "lucide-react";

import { getClientWithCommandes } from "@/server/queries/client.queries";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { RelanceWhatsappButton } from "./_components/relance-whatsapp-button";

export const metadata: Metadata = { title: "Détail client" };

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string; clientId: string }>;
}) {
  const { id: boutiqueId, clientId } = await params;
  const client = await getClientWithCommandes(boutiqueId, clientId);

  if (!client) notFound();

  const commandes = client.commandes;
  const commandesValides = commandes.filter((c) => c.etat !== "ANNULEE");
  const totalDepense = commandesValides.reduce((sum, c) => sum + c.total, 0);
  const derniereCommande = commandes[0];
  const initials = `${client.prenom?.[0] || ""}${client.nom?.[0] || ""}`.toUpperCase() || "C";

  return (
    <div className="space-y-5 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="icon" className="shrink-0" aria-label="Retour aux clients">
            <Link href={`/boutiques/${boutiqueId}/clients`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-brand/10 flex items-center justify-center text-brand font-black text-lg">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
              {client.prenom} {client.nom}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Client depuis le {formatDate(client.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:items-center">
          <RelanceWhatsappButton
            boutiqueId={boutiqueId}
            clientId={client.id}
            telephone={client.telephone}
          />
          <Button asChild variant="brand" className="w-full sm:w-auto h-11 rounded-xl font-black shadow-lg shadow-brand/20">
            <Link href={`/boutiques/${boutiqueId}/commandes/new`}>
              <Plus className="mr-2 h-4 w-4" /> Nouvelle commande
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShoppingCart className="h-4 w-4 shrink-0" />
              <p className="text-[10px] font-black uppercase tracking-widest">Commandes</p>
            </div>
            <p className="mt-2 text-2xl font-black">{commandes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4 shrink-0" />
              <p className="text-[10px] font-black uppercase tracking-widest">Total dépensé</p>
            </div>
            <p className="mt-2 text-2xl font-black text-brand truncate">{formatCurrency(totalDepense)}</p>
            <p className="text-[10px] text-muted-foreground font-bold">hors commandes annulées</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="h-4 w-4 shrink-0" />
              <p className="text-[10px] font-black uppercase tracking-widest">Dernière commande</p>
            </div>
            <p className="mt-2 text-lg font-black">
              {derniereCommande ? formatDate(derniereCommande.date) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-3">
        {/* Historique des commandes */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Historique des commandes ({commandes.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 sm:pt-0">
            {commandes.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground font-medium">
                  Aucune commande pour ce client pour le moment.
                </p>
                <Button asChild variant="brand-outline" className="rounded-xl h-10 font-bold">
                  <Link href={`/boutiques/${boutiqueId}/commandes/new`}>Enregistrer sa première commande</Link>
                </Button>
              </div>
            ) : (
              <>
                {/* Mobile : cartes */}
                <ul className="space-y-3 sm:hidden">
                  {commandes.map((commande) => (
                    <li key={commande.id}>
                      <Link
                        href={`/boutiques/${boutiqueId}/commandes/${commande.id}`}
                        className="block rounded-xl border border-border p-3 transition-colors hover:border-brand/50 hover:bg-muted/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{commande.code}</p>
                            <p className="text-[11px] text-muted-foreground">{formatDateTime(commande.date)}</p>
                          </div>
                          <StatusBadge status={commande.etat} />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {commande._count.lignes} article{commande._count.lignes > 1 ? "s" : ""}
                          </span>
                          <span className="font-black text-brand">{formatCurrency(commande.total)}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Desktop : table */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Commande</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Articles</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">État</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commandes.map((commande) => (
                        <TableRow key={commande.id} className="group">
                          <TableCell className="font-medium">
                            <Link
                              href={`/boutiques/${boutiqueId}/commandes/${commande.id}`}
                              className="font-mono text-xs font-bold text-brand hover:underline"
                            >
                              {commande.code}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {formatDateTime(commande.date)}
                          </TableCell>
                          <TableCell className="text-right">{commande._count.lignes}</TableCell>
                          <TableCell className="text-right font-medium whitespace-nowrap">
                            {formatCurrency(commande.total)}
                          </TableCell>
                          <TableCell className="text-right">
                            <StatusBadge status={commande.etat} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Coordonnées */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {client.telephone && (
                <a
                  href={`tel:${client.telephone.replace(/\s+/g, "")}`}
                  className="flex items-center gap-2.5 text-muted-foreground hover:text-brand transition-colors break-words group"
                >
                  <Phone className="h-4 w-4 shrink-0 group-hover:text-brand" strokeWidth={1.5} />
                  <span className="font-medium">{client.telephone}</span>
                </a>
              )}
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-2.5 text-muted-foreground hover:text-brand transition-colors break-words group"
                >
                  <Mail className="h-4 w-4 shrink-0 group-hover:text-brand" strokeWidth={1.5} />
                  <span className="font-medium">{client.email}</span>
                </a>
              )}
              {client.adresse && (
                <div className="flex items-start gap-2.5 text-muted-foreground break-words">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" strokeWidth={1.5} />
                  <span className="font-medium">{client.adresse}</span>
                </div>
              )}
              {!client.telephone && !client.email && !client.adresse && (
                <p className="text-muted-foreground">Aucune coordonnée renseignée.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
