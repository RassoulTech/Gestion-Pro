import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Store,
  ArrowRight,
  Calendar,
  Package,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Mes commandes — GestionPro" };

const ETAT_META: Record<
  string,
  { label: string; icon: typeof Clock; color: string }
> = {
  EN_ATTENTE: { label: "En attente", icon: Clock, color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  VALIDEE: { label: "Validée", icon: CheckCircle2, color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  LIVREE: { label: "Livrée", icon: Truck, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  ANNULEE: { label: "Annulée", icon: XCircle, color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

export default async function MesCommandesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/mes-commandes");
  }

  const commandes = await prisma.commandeClient.findMany({
    where: { userId: session.user.id },
    include: {
      boutique: { select: { id: true, nom: true, slug: true, logo: true } },
      lignes: {
        include: { produit: { select: { nom: true, photo: true } } },
      },
      _count: { select: { lignes: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const totalSpent = commandes.reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 lg:py-20 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <Package className="h-3 w-3" /> Historique d&apos;achats
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">Mes commandes</h1>
          <p className="text-zinc-400 font-semibold text-sm sm:text-base">
            Suivez toutes vos commandes passées sur le marketplace GestionPro.
          </p>
        </div>

        {/* Summary stats */}
        {commandes.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total commandes</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{commandes.length}</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Montant total dépensé</p>
              <p className="text-2xl sm:text-3xl font-black mt-1 text-emerald-400">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 col-span-2 sm:col-span-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Boutiques fréquentées</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">
                {new Set(commandes.map((c) => c.boutiqueId)).size}
              </p>
            </div>
          </div>
        )}

        {/* Orders list */}
        {commandes.length === 0 ? (
          <div className="rounded-[2.5rem] border border-zinc-800 bg-zinc-900/60 p-10 sm:p-16 text-center space-y-6">
            <div className="mx-auto h-20 w-20 rounded-full bg-zinc-800 flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-zinc-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black">Aucune commande pour l&apos;instant</h2>
              <p className="text-zinc-400 text-sm font-semibold max-w-md mx-auto">
                Explorez le marketplace pour découvrir des boutiques et passer votre première commande.
              </p>
            </div>
            <Button asChild className="rounded-2xl h-13 px-8 font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-none">
              <Link href="/marketplace">Explorer le marketplace</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {commandes.map((commande) => {
              const meta = ETAT_META[commande.etat] || ETAT_META.EN_ATTENTE!;
              const Icon = meta.icon;

              return (
                <div
                  key={commande.id}
                  className="rounded-[2rem] border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-5 sm:p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900/80"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    {/* Left: boutique + meta */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-2xl bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                        <Store className="h-6 w-6 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/s/${commande.boutique.slug}`}
                          className="font-black text-sm sm:text-base hover:text-emerald-400 transition-colors"
                        >
                          {commande.boutique.nom}
                        </Link>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-0.5">
                          Commande {commande.code}
                        </p>
                        <p className="text-[11px] text-zinc-400 font-bold mt-1.5 flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(commande.date)}
                        </p>
                      </div>
                    </div>

                    {/* Right: total + status */}
                    <div className="flex items-center sm:flex-col sm:items-end justify-between gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total</p>
                        <p className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5">
                          {formatCurrency(commande.total)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                          meta.color
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </div>
                  </div>

                  {/* Order lines preview */}
                  <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-wrap gap-2">
                    {commande.lignes.slice(0, 4).map((ligne) => (
                      <span
                        key={ligne.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950/60 border border-zinc-800 px-3 py-1 text-[11px] font-bold text-zinc-300"
                      >
                        {ligne.quantite}× {ligne.produit.nom}
                      </span>
                    ))}
                    {commande._count.lignes > 4 && (
                      <span className="inline-flex items-center rounded-full bg-zinc-950/60 border border-zinc-800 px-3 py-1 text-[11px] font-bold text-zinc-500">
                        +{commande._count.lignes - 4} autres
                      </span>
                    )}
                  </div>

                  {/* Footer: shop link */}
                  <div className="mt-4 flex justify-end">
                    <Link
                      href={`/s/${commande.boutique.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Revoir la boutique
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
