import { Suspense } from "react";
import { getActivityLogs } from "@/server/queries/admin.queries";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/loading";
import { Activity, User, Network, ShieldAlert, Cpu, Database, Eye } from "lucide-react";

export const metadata = { title: "Journal d'Audit - Admin" };

// Dynamic visual styling for activity actions
function getActionIcon(action: string) {
  const normalized = action.toLowerCase();
  if (normalized.includes("login") || normalized.includes("connexion")) {
    return { icon: User, color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30" };
  }
  if (normalized.includes("create") || normalized.includes("add") || normalized.includes("ajout")) {
    return { icon: Database, color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30" };
  }
  if (normalized.includes("delete") || normalized.includes("remove") || normalized.includes("supprim")) {
    return { icon: ShieldAlert, color: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30" };
  }
  if (normalized.includes("update") || normalized.includes("edit") || normalized.includes("modif")) {
    return { icon: Cpu, color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30" };
  }
  return { icon: Activity, color: "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/30" };
}

async function LogsContent() {
  const { data: logs, total } = await getActivityLogs();

  return (
    <>
      <div className="relative border-l border-zinc-200/80 ml-4 pl-8 space-y-8 dark:border-zinc-800/80">
        {logs.length === 0 ? (
          <p className="text-sm text-zinc-500 py-10">Aucun log enregistré dans la base de données.</p>
        ) : (
          logs.map((log) => {
            const audit = getActionIcon(log.action);
            const AuditIcon = audit.icon;
            return (
              <div key={log.id} className="relative group">
                {/* Timeline axis dot/icon bubble */}
                <div className={`absolute -left-[48px] top-0 flex h-9.5 w-9.5 items-center justify-center rounded-xl border border-zinc-200/50 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950 ${audit.color} transition-all duration-300 group-hover:scale-110`}>
                  <AuditIcon className="h-4.5 w-4.5" />
                </div>

                <div className="rounded-2xl border border-zinc-200/50 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/70 transition-all duration-200 hover:shadow-md hover:border-zinc-200 dark:hover:border-zinc-800">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                          {log.action}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                          {log.subjectType || "Système"}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        Déclenché par : <span className="font-bold text-zinc-800 dark:text-zinc-200">{log.user?.name || log.user?.email || "Système"}</span>
                      </p>
                    </div>

                    <div className="text-left sm:text-right space-y-1">
                      <p className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-500">
                        {formatDateTime(log.createdAt)}
                      </p>
                      {log.ipAddress && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400 font-mono">
                          <Network className="h-3 w-3" /> {log.ipAddress}
                        </span>
                      )}
                    </div>
                  </div>

                  {log.subjectId && (
                    <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-zinc-50/50 p-2.5 dark:bg-zinc-900/30 border border-zinc-100/50 dark:border-zinc-900/30">
                      <Eye className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                        ID Sujet : <span className="font-semibold text-zinc-700 dark:text-zinc-300">{log.subjectId}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between mt-8 pl-12">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
          Total : {total} trace(s) d&apos;activité enregistrée(s)
        </p>
      </div>
    </>
  );
}

export default function AdminLogsPage() {
  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0 border-b border-zinc-100 pb-6 dark:border-zinc-900">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-violet-50 p-2 dark:bg-violet-950/30">
              <Activity className="h-5 w-5 text-violet-600 dark:text-violet-400" />
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

