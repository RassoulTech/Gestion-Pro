import { Suspense } from "react";
import { getAllVendeurs } from "@/server/queries/admin.queries";
import { formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { TableSkeleton } from "@/components/loading";
import { ToggleStatusButton } from "../_components/toggle-status-button";
import { Users, Shield, Calendar, Store, Mail } from "lucide-react";

export const metadata = { title: "Vendeurs - Admin" };

// List of vibrant gradients to assign beautiful avatars dynamically
const gradients = [
  "from-violet-500 to-indigo-600",
  "from-emerald-400 to-teal-600",
  "from-blue-500 to-cyan-600",
  "from-rose-500 to-pink-600",
  "from-amber-400 to-orange-600",
];

function getGradient(name: string) {
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  return gradients[code % gradients.length];
}

async function VendeursContent() {
  const { data: vendeurs, total } = await getAllVendeurs();

  return (
    <>
      {/* Mobile Card View (md:hidden) */}
      <div className="grid gap-4 md:hidden">
        {vendeurs.length === 0 ? (
          <div className="text-center py-10 text-zinc-400">
            Aucun vendeur trouvé sur la plateforme.
          </div>
        ) : (
          vendeurs.map((v) => {
            const initials = `${v.prenom.charAt(0)}${v.nom.charAt(0)}`.toUpperCase();
            const avatarGrad = getGradient(v.prenom + v.nom);
            return (
              <div
                key={v.id}
                className="relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/70"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGrad} text-white font-bold text-sm shadow-md`}>
                      {initials}
                    </div>
                    <div>
                      <span className="block font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                        {v.prenom} {v.nom}
                      </span>
                      <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 font-mono">ID: {v.id.slice(0, 8)}</span>
                    </div>
                  </div>
                  <StatusBadge status={v.statut} />
                </div>

                <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-900 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 flex items-center gap-1"><Mail className="h-3 w-3" /> Email</span>
                    <span className="font-mono text-zinc-700 dark:text-zinc-300 break-all max-w-[200px] text-right">{v.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 flex items-center gap-1"><Store className="h-3 w-3" /> Boutiques</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{v._count.boutiques}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Inscription</span>
                    <span className="font-medium text-zinc-500 dark:text-zinc-400">{formatDate(v.createdAt)}</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                  <ToggleStatusButton id={v.id} currentStatut={v.statut} type="vendeur" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (md:block) */}
      <div className="hidden md:block relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/90 shadow-xl shadow-zinc-100/40 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/90 dark:shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50/50 dark:border-zinc-900 dark:bg-zinc-900/40">
                <TableHead className="py-4 font-bold text-zinc-800 dark:text-zinc-200">Vendeur</TableHead>
                <TableHead className="py-4 font-bold text-zinc-800 dark:text-zinc-200">
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-zinc-400" /> Email</span>
                </TableHead>
                <TableHead className="py-4 font-bold text-zinc-800 dark:text-zinc-200">
                  <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-zinc-400" /> Statut</span>
                </TableHead>
                <TableHead className="py-4 font-bold text-zinc-800 dark:text-zinc-200 text-center">
                  <span className="flex items-center justify-center gap-1.5"><Store className="h-3.5 w-3.5 text-zinc-400" /> Boutiques</span>
                </TableHead>
                <TableHead className="py-4 font-bold text-zinc-800 dark:text-zinc-200">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-zinc-400" /> Inscription</span>
                </TableHead>
                <TableHead className="py-4 font-bold text-zinc-800 dark:text-zinc-200 text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendeurs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-zinc-400">
                    Aucun vendeur trouvé sur la plateforme.
                  </TableCell>
                </TableRow>
              ) : (
                vendeurs.map((v) => {
                  const initials = `${v.prenom.charAt(0)}${v.nom.charAt(0)}`.toUpperCase();
                  const avatarGrad = getGradient(v.prenom + v.nom);
                  return (
                    <TableRow key={v.id} className="border-b border-zinc-100 hover:bg-zinc-50/40 dark:border-zinc-900 dark:hover:bg-zinc-900/30 transition-colors">
                      <TableCell className="py-4 font-semibold text-zinc-950 dark:text-zinc-50 pl-6">
                        <div className="flex items-center space-x-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGrad} text-white font-bold text-xs shadow-md`}>
                            {initials}
                          </div>
                          <div>
                            <span className="block font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                              {v.prenom} {v.nom}
                            </span>
                            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">ID: {v.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                        {v.email}
                      </TableCell>
                      <TableCell className="py-4">
                        <StatusBadge status={v.statut} />
                      </TableCell>
                      <TableCell className="py-4 text-center font-bold text-zinc-800 dark:text-zinc-200">
                        <span className="inline-flex items-center justify-center min-w-6 px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold">
                          {v._count.boutiques}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                        {formatDate(v.createdAt)}
                      </TableCell>
                      <TableCell className="py-4 text-right pr-6">
                        <ToggleStatusButton id={v.id} currentStatut={v.statut} type="vendeur" />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 px-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
          Total : {total} vendeur(s) inscrit(s)
        </p>
      </div>
    </>
  );
}

export default function AdminVendeursPage() {
  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0 border-b border-zinc-100 pb-6 dark:border-zinc-900">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-violet-50 p-2 dark:bg-violet-950/30">
              <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Gestion des Vendeurs
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Gérez le statut des marchands de la plateforme, validez leurs comptes ou suspendez-les si nécessaire.
          </p>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <VendeursContent />
      </Suspense>
    </div>
  );
}

