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
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0 border-b border-zinc-100 pb-6 dark:border-zinc-900">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-orange-50 p-2 dark:bg-orange-950/30">
              <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Journal d&apos;Audit Plateforme
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Consultez toutes les traces d&apos;activité et actions de sécurité exécutées sur GestionPro.
          </p>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <LogsContent />
      </Suspense>
    </div>
  );
}

