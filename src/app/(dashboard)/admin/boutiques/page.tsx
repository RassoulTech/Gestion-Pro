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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 to-orange-950 p-8 sm:p-12 text-white shadow-2xl border border-white/10">
        <div className="absolute right-[-10%] top-[-20%] h-64 w-64 rounded-full bg-orange-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute left-[-10%] bottom-[-20%] h-64 w-64 rounded-full bg-amber-500/20 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter flex items-center gap-3">
              Annuaire <span className="text-orange-400">Boutiques</span>
              <Store className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400" />
            </h1>
            <p className="text-sm text-slate-400 max-w-xl font-bold leading-relaxed">
              Surveillez, activez et gérez les boutiques créées par vos marchands sur la plateforme GestionPro.
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <div className="rounded-3xl border border-slate-200/50 bg-white/60 backdrop-blur-xl p-2 sm:p-4 shadow-xl shadow-slate-200/30 dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none">
          <BoutiquesContent />
        </div>
      </Suspense>
    </div>
  );
}

