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
  const typedAbonnements = abonnements.map((a: any) => ({
    ...a,
    statut: a.statut as "EN_ATTENTE" | "ACTIF" | "EXPIRATION_PROCHE" | "EXPIRE" | "ANNULE",
  }));

  return (
    <div className="space-y-8 pb-20">
      {/* Dynamic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 to-orange-950 p-6 sm:p-8 md:p-12 text-white shadow-2xl border border-white/10">
        <div className="absolute right-[-10%] top-[-20%] h-64 w-64 rounded-full bg-orange-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute left-[-10%] bottom-[-20%] h-64 w-64 rounded-full bg-amber-500/20 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter flex items-center flex-wrap gap-3">
              Abonnements <span className="text-orange-400">Marchands</span>
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400" />
            </h1>
            <p className="text-sm text-slate-400 max-w-xl font-bold leading-relaxed">
              Consultez les souscriptions actives et l&apos;historique de facturation récurrente de vos marchands.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/50 bg-white/60 backdrop-blur-xl p-2 sm:p-4 shadow-xl shadow-slate-200/30 dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none">
        <AbonnementsClientTable initialAbonnements={typedAbonnements} />
      </div>
    </div>
  );
}

