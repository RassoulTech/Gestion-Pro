 
import React from "react";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import {
  Package,
  ShoppingCart,
  Plus,
  AlertTriangle,
  Wallet,
  Users,
  ArrowRight,
  Zap,
  Calendar,
  Layers,
  History,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { FinanceSection } from "./_components/finance-section";

interface BoutiquePageProps {
  params: Promise<{ id: string }>;
}

export default async function BoutiqueDashboardPage({
  params,
}: BoutiquePageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    boutique,
    ventesMoisAgg,
    depensesMoisAgg,
    ventesSemaineAgg,
    depensesSemaineAgg,
    ventesTotal,
    depensesTotal,
  ] = await Promise.all([
    prisma.boutique.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            produits: true,
            commandesClient: true,
            depenses: true,
            clients: true,
          },
        },
        produits: {
          where: { quantite: { lte: 5 } },
          take: 5,
        },
        commandesClient: {
          take: 6,
          orderBy: { createdAt: "desc" },
          include: { client: true, lignes: true },
        },
        depenses: {
          take: 3,
          orderBy: { date: "desc" },
        },
      },
    }),
    // Month sales
    prisma.commandeClient.aggregate({
      where: { boutiqueId: id, createdAt: { gte: startOfMonth } },
      _sum: { total: true },
    }),
    // Month expenses
    prisma.depense.aggregate({
      where: { boutiqueId: id, date: { gte: startOfMonth } },
      _sum: { montant: true },
    }),
    // Week sales
    prisma.commandeClient.aggregate({
      where: { boutiqueId: id, createdAt: { gte: startOfWeek } },
      _sum: { total: true },
    }),
    // Week expenses
    prisma.depense.aggregate({
      where: { boutiqueId: id, date: { gte: startOfWeek } },
      _sum: { montant: true },
    }),
    // All-time sales
    prisma.commandeClient.aggregate({
      where: { boutiqueId: id },
      _sum: { total: true },
    }),
    // All-time expenses
    prisma.depense.aggregate({
      where: { boutiqueId: id },
      _sum: { montant: true },
    }),
  ]);

  if (!boutique) notFound();

  const financeData = {
    ventesTotal: ventesTotal._sum.total ?? 0,
    ventesMois: ventesMoisAgg._sum.total ?? 0,
    ventesSemaine: ventesSemaineAgg._sum.total ?? 0,
    depensesTotal: depensesTotal._sum.montant ?? 0,
    depensesMois: depensesMoisAgg._sum.montant ?? 0,
    depensesSemaine: depensesSemaineAgg._sum.montant ?? 0,
  };

  const allTimeBenefice = financeData.ventesTotal - financeData.depensesTotal;

  const stats = [
    {
      label: "Produits",
      value: boutique._count.produits,
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      trend: "Stock",
    },
    {
      label: "Ventes",
      value: boutique._count.commandesClient,
      icon: ShoppingCart,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      trend: "Total",
    },
    {
      label: "Clients",
      value: boutique._count.clients,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      trend: "Total",
    },
    {
      label: "Dépenses",
      value: boutique._count.depenses,
      icon: Wallet,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      trend: "Total",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-10 pb-6">
      {/* Header Premium & Dynamic Hero */}
      <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] lg:rounded-[3.5rem] bg-zinc-950 p-5 sm:p-10 text-white shadow-2xl lg:p-16">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-brand/30 blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-emerald-500/20 blur-[100px]" />

        <div className="relative z-10 flex flex-col gap-6 sm:gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-400">
                En ligne
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter lg:text-7xl">
              {boutique.nom}
            </h1>
            <div className="flex flex-wrap gap-3 sm:gap-6 text-zinc-400 font-bold text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand" />
                <span>
                  {new Date().toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:flex">
            <Button
              asChild
              size="lg"
              variant="brand"
              className="h-12 sm:h-16 rounded-xl sm:rounded-2xl px-4 sm:px-8 font-black shadow-2xl shadow-brand/40 hover:scale-105 transition-all text-xs sm:text-sm"
            >
              <Link href={`/boutiques/${id}/commandes/new`}>
                <Zap className="mr-1 sm:mr-2 h-4 w-4 sm:h-6 sm:w-6 fill-white" />
                Vente Rapide
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 sm:h-16 rounded-xl sm:rounded-2xl px-4 sm:px-8 font-black border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 text-white border-2 text-xs sm:text-sm"
            >
              <Link href={`/boutiques/${id}/produits/new`}>
                <Plus className="mr-1 sm:mr-2 h-4 w-4 sm:h-6 sm:w-6" />
                Produit
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Stats Bento Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="relative group p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white dark:bg-zinc-900 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden"
          >
            <div
              className={`absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full ${stat.bg} blur-2xl opacity-50 group-hover:opacity-100 transition-opacity`}
            />
            <div className="relative z-10">
              <div
                className={`mb-3 sm:mb-6 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 w-fit ${stat.bg} ${stat.color} ring-1 ring-inset ring-white/10 shadow-inner`}
              >
                <stat.icon className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-4xl font-black tracking-tighter leading-none">
                  {stat.value}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-1 sm:mt-2 gap-1">
                  <p className="text-xs sm:text-sm font-bold text-muted-foreground">
                    {stat.label}
                  </p>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md w-fit">
                    {stat.trend}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-12">
        {/* Performance & Revenue Section */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          <FinanceSection data={financeData} />

          <Card className="border-none bg-white dark:bg-zinc-900 shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden">
            <CardHeader className="p-5 sm:p-10 pb-2">
              <CardTitle className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 sm:gap-3">
                <History className="h-6 w-6 sm:h-7 sm:w-7 text-brand" />
                Flux des Ventes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-10 pt-4 sm:pt-6">
              {boutique.commandesClient.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {boutique.commandesClient.map((cmd) => (
                    <div
                      key={cmd.id}
                      className="group flex items-center justify-between p-3 sm:p-6 rounded-[1.2rem] sm:rounded-[2rem] bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all gap-3"
                    >
                      <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                        <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">
                          <ShoppingCart className="h-5 w-5 sm:h-7 sm:w-7 text-brand" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-sm sm:text-base truncate">
                            {cmd.client
                              ? `${cmd.client.prenom} ${cmd.client.nom}`
                              : "Vente Comptoir"}
                          </p>
                          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {new Date(cmd.createdAt).toLocaleTimeString()} •{" "}
                            {cmd.lignes.length} art.
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-sm sm:text-xl tracking-tighter text-emerald-600">
                          {cmd.total.toLocaleString()}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[8px] sm:text-[9px] uppercase font-black px-1.5 sm:px-2 py-0.5 border-emerald-500/20 text-emerald-600"
                        >
                          {cmd.etat}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-bold text-muted-foreground">Aucune vente enregistrée</p>
                </div>
              )}
              <Button
                asChild
                variant="ghost"
                className="w-full mt-4 sm:mt-6 h-11 sm:h-14 rounded-xl sm:rounded-2xl font-black text-muted-foreground hover:text-brand transition-colors text-sm"
              >
                <Link href={`/boutiques/${id}/commandes`}>
                  Journal complet des ventes{" "}
                  <ArrowRight className="ml-2 sm:ml-3 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Status & Critical Info */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8">
          <Card className="border-none bg-rose-600 text-white shadow-2xl shadow-rose-600/20 rounded-[1.5rem] sm:rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden">
            <CardHeader className="p-5 sm:p-8 pb-3 sm:pb-4">
              <CardTitle className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 sm:gap-3">
                <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7 animate-bounce" />
                Alertes Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-8 pt-2 sm:pt-4">
              {boutique.produits.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {boutique.produits.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/10"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white flex items-center justify-center shadow-lg relative shrink-0">
                          {p.photo ? (
                            <Image
                              src={p.photo}
                              alt={p.nom}
                              fill
                              className="object-cover rounded-lg sm:rounded-xl"
                              unoptimized
                            />
                          ) : (
                            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600" />
                          )}
                        </div>
                        <p className="font-black text-xs sm:text-sm truncate">
                          {p.nom}
                        </p>
                      </div>
                      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white flex items-center justify-center font-black text-rose-600 shadow-lg text-sm shrink-0">
                        {p.quantite}
                      </div>
                    </div>
                  ))}
                  <Button
                    asChild
                    variant="outline"
                    className="w-full mt-3 sm:mt-4 h-11 sm:h-12 rounded-xl font-black border-white/20 bg-white/5 hover:bg-white/10 text-white"
                  >
                    <Link href={`/boutiques/${id}/produits`}>
                      Ravitaillement
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="py-6 text-center opacity-80">
                  <p className="font-bold">Tout est sous contrôle !</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none bg-white dark:bg-zinc-900 shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden">
            <CardHeader className="p-5 sm:p-8 pb-3 sm:pb-4">
              <CardTitle className="text-xl sm:text-2xl font-black tracking-tight">
                Dépenses Récentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-8 pt-2 sm:pt-4 space-y-4 sm:space-y-6">
              {boutique.depenses.length > 0 ? (
                boutique.depenses.map((dep) => (
                  <div
                    key={dep.id}
                    className="flex items-start justify-between gap-3 sm:gap-4"
                  >
                    <div className="flex gap-3 sm:gap-4 min-w-0">
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-rose-500 shrink-0">
                        <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-xs sm:text-sm truncate">
                          {dep.libelle}
                        </p>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">
                          {new Date(dep.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-rose-500 text-xs sm:text-sm whitespace-nowrap shrink-0">
                      {dep.montant.toLocaleString()} FCFA
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground font-bold">Aucune dépense</p>
                </div>
              )}
              <Button
                asChild
                variant="outline"
                className="w-full h-11 sm:h-12 rounded-xl font-black border-2"
              >
                <Link href={`/boutiques/${id}/depenses`}>
                  Détails des frais
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* All-time summary card */}
          <Card className="border-none bg-brand text-white shadow-2xl shadow-brand/20 rounded-[1.5rem] sm:rounded-[2.5rem] lg:rounded-[3rem] p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Layers className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight">
                Bilan Global
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/70 font-bold text-xs sm:text-sm">Total ventes</span>
                <span className="font-black text-sm sm:text-base">{financeData.ventesTotal.toLocaleString()} FCFA</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 font-bold text-xs sm:text-sm">Total dépenses</span>
                <span className="font-black text-sm sm:text-base">{financeData.depensesTotal.toLocaleString()} FCFA</span>
              </div>
              <div className="h-px bg-white/20 my-2" />
              <div className="flex items-center justify-between">
                <span className="text-white/70 font-bold text-xs sm:text-sm">Bénéfice total</span>
                <span className={cn("font-black text-base sm:text-lg", allTimeBenefice >= 0 ? "text-emerald-300" : "text-rose-300")}>
                  {allTimeBenefice.toLocaleString()} FCFA
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
