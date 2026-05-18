/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
 
import { 
  Plus, 
  Store, 
  ArrowRight, 
  LayoutDashboard, 
  Settings, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Star, 
  MoreVertical, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink,
  DollarSign
} from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default async function BoutiquesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const vendeur = await prisma.vendeur.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      nom: true,
      prenom: true,
      boutiques: {
        include: {
          _count: {
            select: { produits: true, commandesClient: true }
          }
        }
      },
      abonnements: {
        where: { statut: { in: ["ESSAI", "ACTIF"] } },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
  });

  if (!vendeur) redirect("/onboarding");

  const boutiques = vendeur.boutiques;
  const currentPlan = vendeur.abonnements[0]?.plan;
  const maxBoutiques = currentPlan?.maxBoutiques ?? 1;
  const canCreate = boutiques.length < maxBoutiques;

  // Global calculations for the portfolio header stats
  const totalBoutiques = boutiques.length;
  const totalProduits = boutiques.reduce((acc, b) => acc + b._count.produits, 0);
  const totalVentes = boutiques.reduce((acc, b) => acc + b._count.commandesClient, 0);
  const totalRevenue = totalVentes * 15000; // estimated mock revenue

  return (
    <div className="max-w-7xl mx-auto space-y-10 sm:space-y-14 py-4 sm:py-8 px-4 sm:px-6">
      
      {/* Top Banner and Navigation Portfolio */}
      <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-br from-slate-900 via-zinc-900 to-indigo-950 p-6 sm:p-12 text-white shadow-2xl">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-blue-500/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-purple-500/20 blur-[100px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400">
                <Sparkles className="w-3.5 h-3.5" />
                Tableau de Bord Vendeur
              </span>
              {currentPlan && (
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-none rounded-lg px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-extrabold shadow-md">
                  Plan {currentPlan.nom}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-none">
              Bonjour, {vendeur.prenom} !
            </h1>
            <p className="text-zinc-400 font-medium max-w-xl text-sm sm:text-base">
              Gérez vos commerces, suivez vos stocks en temps réel et analysez vos ventes depuis un espace unique.
            </p>
          </div>

          <div>
            {canCreate ? (
              <Button asChild size="xl" variant="premium" className="w-full sm:w-auto h-14 rounded-2xl px-8 font-extrabold transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/20">
                <Link href="/boutiques/new">
                  <Plus className="mr-2.5 h-5 w-5" />
                  Créer une boutique
                </Link>
              </Button>
            ) : (
              <div className="text-center sm:text-right space-y-2">
                <Button size="xl" variant="outline" className="w-full sm:w-auto h-14 rounded-2xl px-8 font-extrabold opacity-50 cursor-not-allowed border-zinc-700 bg-zinc-800 text-zinc-400" disabled>
                  <Plus className="mr-2 h-5 w-5" />
                  Créer une boutique
                </Button>
                <p className="text-xs text-zinc-400 font-bold">
                  Limite atteinte — <Link href="/pricing" className="text-blue-400 hover:underline">passez au plan supérieur</Link>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mini stats portfolio overview */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/5">
          <div className="space-y-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Boutiques</span>
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-blue-400" />
              <span className="text-xl sm:text-2xl font-black">{totalBoutiques} / {maxBoutiques}</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Produits total</span>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-400" />
              <span className="text-xl sm:text-2xl font-black">{totalProduits}</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ventes globales</span>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              <span className="text-xl sm:text-2xl font-black">{totalVentes}</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Estimation CA</span>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span className="text-xl sm:text-2xl font-black text-emerald-400">{totalRevenue.toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Section - Boutiques Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <Store className="w-6 h-6 text-blue-500" />
            Mes boutiques actives
          </h2>
          <span className="text-xs font-bold text-zinc-400 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-border/40">
            {totalBoutiques} boutique{totalBoutiques > 1 ? "s" : ""}
          </span>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {boutiques.length > 0 ? (
            boutiques.map((boutique) => {
              const boutiqueRevenue = boutique._count.commandesClient * 15000;
              const boutiqueRating = 4.8; // mock premium score

              return (
                <div 
                  key={boutique.id} 
                  className="group relative flex flex-col bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-blue-500/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                >
                  {/* Decorative background glow on hover */}
                  <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full group-hover:scale-150 transition-all duration-700 pointer-events-none" />
                  
                  {/* Card Header */}
                  <div className="p-6 pb-0 flex items-start justify-between relative z-10">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/50 flex items-center justify-center text-blue-500 overflow-hidden relative shadow-inner group-hover:scale-110 transition-transform duration-300">
                      {boutique.logo ? (
                        <Image 
                          src={boutique.logo} 
                          alt={boutique.nom} 
                          fill 
                          className="object-cover" 
                          unoptimized 
                        />
                      ) : (
                        <Store className="h-8 w-8 text-blue-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Actif
                      </span>
                    </div>
                  </div>

                  {/* Card Title & Desc */}
                  <div className="p-6 pb-2 space-y-2 relative z-10 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100 tracking-tight group-hover:text-blue-500 transition-colors truncate">
                        {boutique.nom}
                      </h3>
                      <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 fill-blue-500/10" />
                    </div>
                    <p className="text-xs font-extrabold uppercase text-blue-500/70 tracking-widest">
                      {boutique.secteurActivite || "Commerce"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                      {boutique.description || "Découvrez nos produits exceptionnels et notre service premium."}
                    </p>
                  </div>

                  {/* Card Stats Grid */}
                  <div className="px-6 py-4 mx-6 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 grid grid-cols-2 gap-3 border border-slate-100/50 dark:border-zinc-800/30">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Produits</span>
                      <div className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-extrabold text-slate-700 dark:text-zinc-200 text-sm">{boutique._count.produits}</span>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Ventes</span>
                      <div className="flex items-center gap-1">
                        <ShoppingCart className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-extrabold text-slate-700 dark:text-zinc-200 text-sm">{boutique._count.commandesClient}</span>
                      </div>
                    </div>
                    <div className="space-y-0.5 col-span-2 pt-2 border-t border-slate-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Revenus</span>
                        <p className="font-extrabold text-xs text-emerald-500">{boutiqueRevenue.toLocaleString()} FCFA</p>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-amber-500">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span className="text-xs font-black">{boutiqueRating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-6 pt-4 flex items-center gap-2 relative z-10">
                    <Button asChild variant="premium" className="flex-1 h-12 rounded-xl font-extrabold shadow-lg shadow-blue-500/10 text-xs">
                      <Link href={`/boutiques/${boutique.id}`}>
                        Dashboard <LayoutDashboard className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-zinc-700 dark:hover:bg-zinc-800 shrink-0">
                          <MoreVertical className="h-4.5 w-4.5 text-slate-600 dark:text-zinc-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl w-52 p-2.5">
                        <DropdownMenuItem asChild className="rounded-xl cursor-pointer h-10 px-3">
                          <Link href={`/boutiques/${boutique.id}/parametres`}>
                            <Settings className="mr-3 h-4 w-4 text-slate-500" />
                            <span className="font-bold">Paramètres boutique</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-xl cursor-pointer h-10 px-3">
                          <Link href={`/boutiques/${boutique.id}/rapports`}>
                            <BarChart3 className="mr-3 h-4 w-4 text-blue-500" />
                            <span className="font-bold">Rapports & Analytics</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1.5" />
                        <DropdownMenuItem asChild className="rounded-xl cursor-pointer h-10 px-3">
                          <Link href={`/s/${boutique.slug}`} target="_blank">
                            <ExternalLink className="mr-3 h-4 w-4 text-purple-500" />
                            <span className="font-bold text-purple-500">Voir boutique publique</span>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          ) : (
            <Card className="col-span-full border-dashed border-2 border-slate-200 dark:border-zinc-800 bg-transparent rounded-[3rem] p-12 sm:p-24 flex flex-col items-center text-center space-y-6">
              <div className="h-20 w-20 sm:h-28 sm:w-28 rounded-full bg-blue-50 dark:bg-zinc-800/80 flex items-center justify-center text-blue-500 shadow-xl shadow-blue-500/5">
                <Store className="h-10 w-10 sm:h-14 sm:w-14" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold tracking-tight">Prêt à lancer votre business ?</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium max-w-sm">
                  Créez votre première boutique pour commencer à gérer vos stocks et vos ventes dès aujourd&apos;hui.
                </p>
              </div>
              <Button asChild size="lg" variant="premium" className="h-14 rounded-2xl px-8 font-extrabold shadow-xl shadow-blue-500/20">
                <Link href="/boutiques/new">Créer ma première boutique</Link>
              </Button>
            </Card>
          )}
        </div>
      </div>
      
    </div>
  );
}
