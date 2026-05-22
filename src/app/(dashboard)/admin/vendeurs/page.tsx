import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllVendeurs, getAllUsersWithoutShop } from "@/server/queries/admin.queries";
import { TableSkeleton } from "@/components/loading";
import { VendeursClientTable } from "./_components/vendeurs-client-table";
import { UsersClientTable } from "./_components/users-client-table";
import { Users, Store, User } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Vendeurs - Admin" };

async function VendeursContent({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const resolvedParams = await searchParams;
  const tab = resolvedParams?.tab || "vendeurs";

  if (tab === "utilisateurs") {
    const { data: users, total } = await getAllUsersWithoutShop();
    return <UsersClientTable initialUsers={users} total={total} />;
  }

  const { data: vendeurs, total } = await getAllVendeurs();

  // Cast statut to meet expected type exactly
  const typedVendeurs = vendeurs.map((v) => ({
    ...v,
    statut: v.statut as "ACTIF" | "SUSPENDU",
  }));

  return <VendeursClientTable initialVendeurs={typedVendeurs} total={total} />;
}

export default async function AdminVendeursPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const resolvedParams = await searchParams;
  const tab = resolvedParams?.tab || "vendeurs";

  return (
    <div className="space-y-8 pb-20">
      {/* Dynamic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 to-indigo-950 p-8 sm:p-12 text-white shadow-2xl border border-white/10">
        <div className="absolute right-[-10%] top-[-20%] h-64 w-64 rounded-full bg-cyan-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute left-[-10%] bottom-[-20%] h-64 w-64 rounded-full bg-violet-500/20 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter flex items-center gap-3">
              Annuaire <span className="text-cyan-400">Vendeurs</span>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400" />
            </h1>
            <p className="text-sm text-slate-400 max-w-xl font-bold leading-relaxed">
              Gérez le statut des marchands de la plateforme, supervisez leurs boutiques et validez leurs accès en un clin d&apos;œil.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px px-2 overflow-x-auto no-scrollbar">
        <Link
          href="?tab=vendeurs"
          className={`flex items-center gap-2 px-4 py-3 text-sm font-extrabold transition-all border-b-2 whitespace-nowrap ${
            tab === "vendeurs"
              ? "border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-cyan-500/5"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
          }`}
        >
          <Store className="h-4 w-4" /> Vendeurs avec boutique
        </Link>
        <Link
          href="?tab=utilisateurs"
          className={`flex items-center gap-2 px-4 py-3 text-sm font-extrabold transition-all border-b-2 whitespace-nowrap ${
            tab === "utilisateurs"
              ? "border-violet-500 text-violet-600 dark:text-violet-400 bg-violet-500/5"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
          }`}
        >
          <User className="h-4 w-4" /> Utilisateurs (sans boutique)
        </Link>
      </div>

      <Suspense fallback={<TableSkeleton />} key={tab}>
        <div className="rounded-3xl border border-slate-200/50 bg-white/60 backdrop-blur-xl p-2 sm:p-4 shadow-xl shadow-slate-200/30 dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none">
          <VendeursContent searchParams={searchParams} />
        </div>
      </Suspense>
    </div>
  );
}

