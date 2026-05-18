import { Suspense } from "react";
import { getAllBoutiques } from "@/server/queries/admin.queries";
import { TableSkeleton } from "@/components/loading";
import { BoutiquesClientTable } from "./_components/boutiques-client-table";
import { Store } from "lucide-react";

export const metadata = { title: "Boutiques - Admin" };

async function BoutiquesContent() {
  const { data: boutiques, total } = await getAllBoutiques();

  // Cast statut to meet expected type exactly
  const typedBoutiques = boutiques.map((b) => ({
    ...b,
    statut: b.statut as "ACTIF" | "SUSPENDU",
  }));

  return <BoutiquesClientTable initialBoutiques={typedBoutiques} total={total} />;
}

export default function AdminBoutiquesPage() {
  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0 border-b border-zinc-100 pb-6 dark:border-zinc-900">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-violet-50 p-2 dark:bg-violet-950/30">
              <Store className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Gestion des Boutiques
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Surveillez, activez et gérez les boutiques créées par vos marchands sur GestionPro.
          </p>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <BoutiquesContent />
      </Suspense>
    </div>
  );
}

