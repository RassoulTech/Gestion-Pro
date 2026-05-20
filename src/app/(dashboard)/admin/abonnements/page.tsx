import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AbonnementsClientTable } from "./_components/abonnements-client-table";
import { CreditCard } from "lucide-react";

export const metadata: Metadata = { title: "Abonnements - Admin" };

export default async function AdminAbonnementsPage() {
  const abonnements = await prisma.abonnement.findMany({
    include: {
      vendeur: { select: { nom: true, prenom: true } },
      plan: { select: { nom: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Cast statut to meet expected type exactly
  const typedAbonnements = abonnements.map((a) => ({
    ...a,
    statut: a.statut as "ACTIF" | "EXPIRATION_PROCHE" | "EXPIRE" | "ANNULE",
  }));

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0 border-b border-zinc-100 pb-6 dark:border-zinc-900">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-orange-50 p-2 dark:bg-orange-950/30">
              <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Abonnements Marchands
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Consultez les souscriptions actives et l&apos;historique de facturation récurrente de vos marchands.
          </p>
        </div>
      </div>

      <AbonnementsClientTable initialAbonnements={typedAbonnements} />
    </div>
  );
}

