/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
 
import { Plus, Users, Search, Phone, Mail, MapPin, Trash2, Edit } from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientActions } from "./_components/client-actions";
import Link from "next/link";

interface ClientsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientsPage({ params }: ClientsPageProps) {
  const { id: boutiqueId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const clients = await prisma.client.findMany({
    where: { boutiqueId },
    orderBy: { nom: "asc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Clients</h1>
          <p className="text-muted-foreground font-medium">Gérez votre base de clients et leur historique.</p>
        </div>
        <Button asChild variant="brand" className="rounded-xl h-12 px-6 font-black shadow-lg shadow-brand/20">
          <Link href={`/boutiques/${boutiqueId}/clients/new`}>
            <Plus className="mr-2 h-5 w-5" />
            Nouveau Client
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un client..." 
              className="pl-12 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none font-bold"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
              <TableRow className="border-none">
                <TableHead className="px-8 py-5 font-black uppercase text-[10px] tracking-widest">Client</TableHead>
                <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest">Contact</TableHead>
                <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest">Adresse</TableHead>
                <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-right px-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length > 0 ? (
                clients.map((client) => (
                  <TableRow key={client.id} className="border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors group">
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand font-black text-lg">
                          {(client.prenom?.[0] || "") + (client.nom?.[0] || "")}
                        </div>
                        <div>
                          <p className="font-black text-base">{client.prenom} {client.nom}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Client Fidèle</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="space-y-1">
                        {client.telephone && (
                          <div className="flex items-center gap-2 text-sm font-bold">
                            <Phone className="h-3 w-3 text-emerald-500" />
                            {client.telephone}
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                            <Mail className="h-3 w-3 text-brand" />
                            {client.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      {client.adresse ? (
                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                          <MapPin className="h-3 w-3 text-amber-500" />
                          {client.adresse}
                        </div>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700 italic text-sm">Non spécifiée</span>
                      )}
                    </TableCell>
                    <TableCell className="px-8 py-6 text-right">
                      <ClientActions
                        clientId={client.id}
                        boutiqueId={boutiqueId}
                        clientNom={`${client.prenom || ""} ${client.nom}`}
                        clientData={{
                          nom: client.nom,
                          prenom: client.prenom,
                          telephone: client.telephone,
                          email: client.email,
                          adresse: client.adresse,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="h-20 w-20 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                        <Users className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xl font-black">Aucun client trouvé</p>
                        <p className="text-muted-foreground font-medium">Commencez par ajouter votre premier client.</p>
                      </div>
                      <Button asChild variant="brand" className="rounded-xl h-12 px-8 font-black">
                        <Link href={`/boutiques/${boutiqueId}/clients/new`}>Ajouter un client</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
