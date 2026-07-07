import type { Metadata } from "next";
import { Suspense } from "react";
import { getActivityLogs } from "@/server/queries/admin.queries";
import { TableSkeleton } from "@/components/loading";
import { LogsClientView } from "./_components/logs-client-view";
import { Activity } from "lucide-react";

export const metadata: Metadata = { title: "Journal d'Audit - Admin" };

async function LogsContent() {
  const { data: logs, total } = await getActivityLogs();

  return <LogsClientView initialLogs={logs} total={total} />;
}

export default function AdminLogsPage() {
  return (
    <div className="space-y-8 pb-20">
      {/* Dynamic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 to-orange-950 p-6 sm:p-8 md:p-12 text-white shadow-2xl border border-white/10">
        <div className="absolute right-[-10%] top-[-20%] h-64 w-64 rounded-full bg-orange-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute left-[-10%] bottom-[-20%] h-64 w-64 rounded-full bg-amber-500/20 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter flex items-center flex-wrap gap-3">
              Journal <span className="text-orange-400">d&apos;Audit</span>
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400" />
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl font-bold leading-relaxed">
              Consultez toutes les traces d&apos;activité et actions de sécurité exécutées sur GestionPro.
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <div className="rounded-3xl border border-zinc-200/50 bg-white/60 backdrop-blur-xl p-2 sm:p-4 shadow-xl shadow-zinc-200/30 dark:border-white/10 dark:bg-zinc-900/50 dark:shadow-none">
          <LogsContent />
        </div>
      </Suspense>
    </div>
  );
}

