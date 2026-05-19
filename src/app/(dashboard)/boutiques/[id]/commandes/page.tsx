import React from "react";
import { redirect, notFound } from "next/navigation";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  ShoppingCart,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface CommandesPageProps {
  params: Promise<{ id: string }>;
}

const statusMap = {
  EN_ATTENTE: { label: "En attente", icon: Clock, color: "text-amber-500 bg-amber-500/10" },
  VALIDEE: { label: "Validée", icon: CheckCircle2, color: "text-blue-500 bg-blue-500/10" },
  LIVREE: { label: "Livrée", icon: Truck, color: "text-emerald-500 bg-emerald-500/10" },
  ANNULEE: { label: "Annulée", icon: XCircle, color: "text-rose-500 bg-rose-500/10" },
};

export default async function CommandesPage({ params }: CommandesPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const boutique = await prisma.boutique.findUnique({
    where: { id },
    include: {
      commandesClient: {
        include: {
          client: true,
          _count: { select: { lignes: true } },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!boutique) notFound();

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Commandes Clients</h1>
          <p className="text-sm text-muted-foreground">Gérez vos ventes et livraisons</p>
        </div>
        <Button asChild variant="brand" className="w-full sm:w-auto rounded-xl font-bold shadow-lg shadow-brand/20 h-11">
          <Link href={`/boutiques/${id}/commandes/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Commande
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par code ou client..."
            className="pl-10 h-11 sm:h-12 rounded-xl bg-card border-none shadow-sm"
          />
        </div>
        <Button variant="outline" className="h-11 sm:h-12 rounded-xl w-full sm:w-auto">
          <Filter className="mr-2 h-4 w-4" />
          Filtres
        </Button>
      </div>

      {/* Orders Table */}
      <div className="rounded-[1.5rem] sm:rounded-[2rem] bg-card/50 shadow-2xl backdrop-blur-md overflow-hidden border-none">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-zinc-100/50 dark:bg-zinc-800/50">
            <TableRow className="border-none">
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground pl-4 sm:pl-8">Commande</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground hidden sm:table-cell">Client</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground text-center hidden md:table-cell">Articles</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right">Total</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground text-center">Statut</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right pr-4 sm:pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {boutique.commandesClient.length > 0 ? (
              boutique.commandesClient.map((commande) => {
                const status = statusMap[commande.etat];
                return (
                  <TableRow key={commande.id} className="border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100/30 dark:hover:bg-zinc-800/30">
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
                          <p className="text-[10px] text-muted-foreground sm:hidden truncate">
                            {commande.client ? `${commande.client.prenom || ""} ${commande.client.nom}` : "Comptoir"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm truncate max-w-[140px]">
                          {commande.client ? `${commande.client.prenom || ""} ${commande.client.nom}` : "Client de passage"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold hidden md:table-cell">
                      {commande._count.lignes}
                    </TableCell>
                    <TableCell className="text-right font-black text-brand whitespace-nowrap text-xs sm:text-sm">
                      {commande.total.toLocaleString()} FCFA
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
                        status.color
                      )}>
                        <status.icon className="h-3 w-3" />
                        {status.label}
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
                            <Link href={`/boutiques/${id}/commandes/${commande.id}`}>
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
                    <p className="text-lg font-bold">Aucune commande</p>
                    <p className="text-muted-foreground">Enregistrez votre première vente pour voir l&apos;historique.</p>
                    <Button asChild variant="brand" className="mt-6 rounded-xl font-bold">
                      <Link href={`/boutiques/${id}/commandes/new`}>Nouvelle vente</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
}
