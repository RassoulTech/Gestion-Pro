import { Suspense } from "react";
import { getAllVendeurs } from "@/server/queries/admin.queries";
import { TableSkeleton } from "@/components/loading";
import { VendeursClientTable } from "./_components/vendeurs-client-table";
import { Users } from "lucide-react";

export const metadata = { title: "Vendeurs - Admin" };

async function VendeursContent() {
  const { data: vendeurs, total } = await getAllVendeurs();

  // Cast statut to meet expected type exactly
  const typedVendeurs = vendeurs.map((v) => ({
    ...v,
    statut: v.statut as "ACTIF" | "SUSPENDU",
  }));

  return <VendeursClientTable initialVendeurs={typedVendeurs} total={total} />;
}

export default function AdminVendeursPage() {
  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0 border-b border-zinc-100 pb-6 dark:border-zinc-900">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-violet-50 p-2 dark:bg-violet-950/30">
              <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Gestion des Vendeurs
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Gérez le statut des marchands de la plateforme, validez leurs comptes ou suspendez-les si nécessaire.
          </p>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <VendeursContent />
      </Suspense>
    </div>
  );
}

