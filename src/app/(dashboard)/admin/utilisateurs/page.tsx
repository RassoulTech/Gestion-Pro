import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllUsersWithoutShop } from "@/server/queries/admin.queries";
import { TableSkeleton } from "@/components/loading";
import { UsersClientTable } from "./_components/users-client-table";
import { User } from "lucide-react";
import { markNotificationsSeen } from "@/server/services/notifications";
import { NotifsRefreshPing } from "@/components/notifications/notifs-refresh-ping";

export const metadata: Metadata = { title: "Utilisateurs - Admin" };

export default async function AdminUtilisateursPage() {
  const { data: users, total } = await getAllUsersWithoutShop();

  // « Lu au passage » : entrer sur la page efface les alertes d'inscription.
  await markNotificationsSeen(["NOUVEL_UTILISATEUR"]);

  return (
    <>
      <NotifsRefreshPing />
      <div className="space-y-8 pb-20">
      {/* Dynamic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 to-orange-950 p-6 sm:p-8 md:p-12 text-white shadow-2xl border border-white/10">
        <div className="absolute right-[-10%] top-[-20%] h-64 w-64 rounded-full bg-orange-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute left-[-10%] bottom-[-20%] h-64 w-64 rounded-full bg-amber-500/20 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter flex items-center flex-wrap gap-3">
              Annuaire <span className="text-orange-400">Utilisateurs</span>
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400" />
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl font-bold leading-relaxed">
              Consultez la liste des utilisateurs inscrits qui n&apos;ont pas encore créé de boutique.
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <div className="rounded-3xl border border-zinc-200/50 bg-white/60 backdrop-blur-xl p-2 sm:p-4 shadow-xl shadow-zinc-200/30 dark:border-white/10 dark:bg-zinc-900/50 dark:shadow-none">
          <UsersClientTable initialUsers={users} total={total} />
        </div>
      </Suspense>
    </div>
  </>
  );
}
