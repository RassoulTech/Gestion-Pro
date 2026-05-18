import { Suspense } from "react";
import { getActivityLogs } from "@/server/queries/admin.queries";
import { formatDateTime } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/loading";

export const metadata = { title: "Logs - Admin" };

async function LogsContent() {
  const { data: logs, total } = await getActivityLogs();

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead><TableHead>Utilisateur</TableHead>
              <TableHead>Action</TableHead><TableHead>Sujet</TableHead><TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap">{formatDateTime(log.createdAt)}</TableCell>
                <TableCell>{log.user?.name || log.user?.email || "—"}</TableCell>
                <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                <TableCell className="text-muted-foreground">
                  {log.subjectType ? `${log.subjectType}#${log.subjectId?.slice(0, 8)}` : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{log.ipAddress || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">{total} entrée(s)</p>
    </>
  );
}

export default function AdminLogsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
        <p className="text-sm text-muted-foreground">Journal d&apos;audit de la plateforme</p>
      </div>
      <Suspense fallback={<TableSkeleton />}><LogsContent /></Suspense>
    </div>
  );
}
