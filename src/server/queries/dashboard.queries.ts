"use server";

import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, format } from "date-fns";

export async function getBoutiqueStats(boutiqueId: string, startDate?: Date, endDate?: Date) {
  const today = startOfDay(new Date());
  const finalStart = startDate || today;
  const finalEnd = endDate || new Date();

  const [ventesPeriod, totalProduits, totalClients, alertesStock] =
    await Promise.all([
      prisma.commandeClient.aggregate({
        where: {
          boutiqueId,
          date: { gte: finalStart, lte: finalEnd },
          etat: { not: "ANNULEE" },
        },
        _sum: { total: true },
      }),
      prisma.produit.count({ where: { boutiqueId } }),
      prisma.client.count({ where: { boutiqueId } }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint as count FROM produits
        WHERE boutique_id = ${boutiqueId} AND quantite <= seuil_alerte
      `,
    ]);

  return {
    ventesPeriod: ventesPeriod._sum.total ?? 0,
    totalProduits,
    totalClients,
    alertesStock: Number(alertesStock[0]?.count ?? 0),
  };
}

export async function getVentesParJour(boutiqueId: string, days = 30, startDate?: Date, endDate?: Date) {
  const finalStart = startDate || subDays(new Date(), days);
  const finalEnd = endDate || new Date();

  const ventes = await prisma.commandeClient.groupBy({
    by: ["date"],
    where: {
      boutiqueId,
      date: {
        gte: finalStart,
        lte: finalEnd,
      },
      etat: { not: "ANNULEE" },
    },
    _sum: { total: true },
    orderBy: { date: "asc" },
  });

  // Calculate dynamic diff days
  const diffTime = Math.abs(finalEnd.getTime() - finalStart.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  const result: { date: string; ventes: number }[] = [];
  for (let i = diffDays; i >= 0; i--) {
    const date = subDays(finalEnd, i);
    const dateStr = format(date, "dd/MM");
    const sale = ventes.find(
      (v) => format(new Date(v.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
    result.push({ date: dateStr, ventes: sale?._sum.total ?? 0 });
  }

  return result;
}

export async function getTopProduits(boutiqueId: string, limit = 5, startDate?: Date, endDate?: Date) {
  const whereClause: any = {
    commande: { boutiqueId, etat: { not: "ANNULEE" } },
  };

  if (startDate || endDate) {
    whereClause.commande.date = {};
    if (startDate) whereClause.commande.date.gte = startDate;
    if (endDate) whereClause.commande.date.lte = endDate;
  }

  const lignes = await prisma.ligneCommandeClient.groupBy({
    by: ["produitId"],
    where: whereClause,
    _sum: { quantite: true },
    orderBy: { _sum: { quantite: "desc" } },
    take: limit,
  });

  const produitIds = lignes.map((l) => l.produitId);
  const produits = await prisma.produit.findMany({
    where: { id: { in: produitIds } },
    select: { id: true, nom: true },
  });

  return lignes.map((l) => ({
    nom: produits.find((p) => p.id === l.produitId)?.nom ?? "Inconnu",
    total: l._sum.quantite ?? 0,
  }));
}

export async function getRecentCommandes(boutiqueId: string, limit = 5) {
  return prisma.commandeClient.findMany({
    where: { boutiqueId },
    include: { client: { select: { nom: true, prenom: true } } },
    orderBy: { date: "desc" },
    take: limit,
  });
}
