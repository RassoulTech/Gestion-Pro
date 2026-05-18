import { Suspense } from "react";
import { getAllBoutiques } from "@/server/queries/admin.queries";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { TableSkeleton } from "@/components/loading";
import { ToggleStatusButton } from "../_components/toggle-status-button";
import { Store, User, Layers, Tag, Package, Calendar } from "lucide-react";

export const metadata = { title: "Boutiques - Admin" };

// Dynamic visual styling for different sectors
function getSectorColor(sector: string) {
  const normalized = sector.toLowerCase();
  if (normalized.includes("mode") || normalized.includes("vêtement") || normalized.includes("fashion")) {
    return "bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900/50";
  }
  if (normalized.includes("tech") || normalized.includes("électronique") || normalized.includes("phone")) {
    return "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50";
  }
  if (normalized.includes("aliment") || normalized.includes("restau") || normalized.includes("nourriture")) {
    return "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50";
  }
  if (normalized.includes("beauté") || normalized.includes("cosmé") || normalized.includes("soin")) {
    return "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50";
  }
  return "bg-zinc-50 text-zinc-700 border-zinc-100 dark:bg-zinc-900/60 dark:text-zinc-300 dark:border-zinc-800/80";
}

async function BoutiquesContent() {
  const { data: boutiques, total } = await getAllBoutiques();

  return (
    <>
      {/* Mobile Card View (md:hidden) */}
      <div className="grid gap-4 md:hidden">
        {boutiques.length === 0 ? (
          <div className="text-center py-10 text-zinc-400">
            Aucune boutique trouvée sur la plateforme.
          </div>
        ) : (
          boutiques.map((b) => {
            const avatarColor = getSectorColor(b.secteurActivite);
            return (
              <div
                key={b.id}
                className="relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/70"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400 font-semibold shadow-sm border border-violet-100/50 dark:border-violet-900/30">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                        {b.nom}
                      </span>
                      <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 font-mono">ID: {b.id.slice(0, 8)}</span>
                    </div>
                  </div>
                  <StatusBadge status={b.statut} />
                </div>

                <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-900 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 flex items-center gap-1"><User className="h-3 w-3" /> Propriétaire</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{b.vendeur.prenom} {b.vendeur.nom}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 flex items-center gap-1"><Tag className="h-3 w-3" /> Secteur</span>
                    <Badge variant="outline" className={`font-semibold px-2 py-0.5 rounded-lg border text-[10px] ${avatarColor}`}>
                      {b.secteurActivite}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 flex items-center gap-1"><Package className="h-3 w-3" /> Produits</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{b._count.produits}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Créée le</span>
                    <span className="font-medium text-zinc-500 dark:text-zinc-400">{formatDate(b.createdAt)}</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                  <ToggleStatusButton id={b.id} currentStatut={b.statut} type="boutique" />
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
                <TableHead className="py-4 font-bold text-zinc-800 dark:text-zinc-200 pl-6">Boutique</TableHead>
                <TableHead className="py-4 font-bold text-zinc-800 dark:text-zinc-200">
                  <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-zinc-400" /> Propriétaire</span>
                </TableHead>
                <TableHead className="py-4 font-bold text-zinc-800 dark:text-zinc-200">
                  <span className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-zinc-400" /> Secteur</span>
                </TableHead>
                <TableHead className="py-4 font-bold text-zinc-800 dark:text-zinc-200">
                  <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 text-zinc-400" /> Statut</span>
                </TableHead>
                <TableHead className="py-4 font-bold text-zinc-800 dark:text-zinc-200 text-center">
                  <span className="flex items-center justify-center gap-1.5"><Package className="h-3.5 w-3.5 text-zinc-400" /> Produits</span>
                </TableHead>
                <TableHead className="py-4 font-bold text-zinc-800 dark:text-zinc-200">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-zinc-400" /> Créée le</span>
                </TableHead>
                <TableHead className="py-4 font-bold text-zinc-800 dark:text-zinc-200 text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boutiques.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-zinc-400">
                    Aucune boutique trouvée sur la plateforme.
                  </TableCell>
                </TableRow>
              ) : (
                boutiques.map((b) => {
                  const avatarColor = getSectorColor(b.secteurActivite);
                  return (
                    <TableRow key={b.id} className="border-b border-zinc-100 hover:bg-zinc-50/40 dark:border-zinc-900 dark:hover:bg-zinc-900/30 transition-colors">
                      <TableCell className="py-4 font-semibold text-zinc-950 dark:text-zinc-50 pl-6">
                        <div className="flex items-center space-x-3.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400 font-semibold shadow-sm border border-violet-100/50 dark:border-violet-900/30">
                            <Store className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="block font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                              {b.nom}
                            </span>
                            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 font-mono">ID: {b.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-zinc-700 dark:text-zinc-300 font-semibold text-sm">
                        {b.vendeur.prenom} {b.vendeur.nom}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className={`font-semibold px-2.5 py-0.5 rounded-lg border text-[11px] ${avatarColor}`}>
                          {b.secteurActivite}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <StatusBadge status={b.statut} />
                      </TableCell>
                      <TableCell className="py-4 text-center font-bold text-zinc-800 dark:text-zinc-200">
                        <span className="inline-flex items-center justify-center min-w-6 px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold">
                          {b._count.produits}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                        {formatDate(b.createdAt)}
                      </TableCell>
                      <TableCell className="py-4 text-right pr-6">
                        <ToggleStatusButton id={b.id} currentStatut={b.statut} type="boutique" />
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
          Total : {total} boutique(s) active(s)
        </p>
      </div>
    </>
  );
}

export default function AdminBoutiquesPage() {
  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0 border-b border-zinc-100 pb-6 dark:border-zinc-900">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-violet-50 p-2 dark:bg-violet-950/30">
              <Store className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Gestion des Boutiques
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Surveillez, activez et gérez les boutiques créées par vos marchands sur GestionPro.
          </p>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <BoutiquesContent />
      </Suspense>
    </div>
  );
}

