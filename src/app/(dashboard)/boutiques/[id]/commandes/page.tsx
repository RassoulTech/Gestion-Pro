import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  CommandesClientTable,
  type CommandeRow,
} from "./_components/commandes-client-table";

interface CommandesPageProps {
  params: Promise<{ id: string }>;
}

export default async function CommandesPage({ params }: CommandesPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const boutique = await prisma.boutique.findUnique({
    where: { id },
    include: {
      commandesClient: {
        include: {
          client: { select: { nom: true, prenom: true } },
          _count: { select: { lignes: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!boutique) notFound();

  const rows: CommandeRow[] = boutique.commandesClient.map((c) => ({
    id: c.id,
    code: c.code,
    date: c.date.toISOString(),
    total: c.total,
    etat: c.etat,
    lignesCount: c._count.lignes,
    client: c.client ? { prenom: c.client.prenom, nom: c.client.nom } : null,
  }));

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

      <CommandesClientTable boutiqueId={id} commandes={rows} />
    </div>
  );
}
