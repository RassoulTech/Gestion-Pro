import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllBoutiques } from "@/server/queries/admin.queries";
import { TableSkeleton } from "@/components/loading";
import { BoutiquesClientTable } from "./_components/boutiques-client-table";
import { Store } from "lucide-react";

export const metadata: Metadata = { title: "Boutiques - Admin" };

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
    <div className="space-y-8 pb-20">
      {/* Dynamic Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-zinc-950 to-zinc-900 p-8 sm:p-12 text-white shadow-2xl border border-zinc-800">
        <div className="absolute right-[-10%] top-[-20%] h-64 w-64 rounded-full bg-orange-600/20 blur-[100px] pointer-events-none" />
        <div className="absolute left-[-10%] bottom-[-20%] h-64 w-64 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter flex items-center gap-3">
              Annuaire <span className="text-orange-500">Boutiques</span>
              <Store className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl font-bold leading-relaxed">
              Surveillez, activez et gérez les boutiques créées par vos marchands sur la plateforme GestionPro.
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <div className="rounded-[2.5rem] border border-zinc-200/50 bg-white p-2 sm:p-4 shadow-xl shadow-zinc-200/40 dark:border-zinc-800/50 dark:bg-zinc-900 dark:shadow-none">
          <BoutiquesContent />
        </div>
      </Suspense>
    </div>
  );
}

