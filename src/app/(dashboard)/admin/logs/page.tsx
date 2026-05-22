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
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-zinc-950 to-zinc-900 p-8 sm:p-12 text-white shadow-2xl border border-zinc-800">
        <div className="absolute right-[-10%] top-[-20%] h-64 w-64 rounded-full bg-orange-600/20 blur-[100px] pointer-events-none" />
        <div className="absolute left-[-10%] bottom-[-20%] h-64 w-64 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter flex items-center gap-3">
              Journal <span className="text-orange-500">d&apos;Audit</span>
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl font-bold leading-relaxed">
              Consultez toutes les traces d&apos;activité et actions de sécurité exécutées sur GestionPro.
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <div className="rounded-[2.5rem] border border-zinc-200/50 bg-white p-2 sm:p-4 shadow-xl shadow-zinc-200/40 dark:border-zinc-800/50 dark:bg-zinc-900 dark:shadow-none">
          <LogsContent />
        </div>
      </Suspense>
    </div>
  );
}

