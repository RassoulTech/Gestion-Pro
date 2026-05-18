"use server";

import { prisma } from "@/lib/prisma";

export async function getAdminStats() {
  const [
    totalUsers,
    totalVendeurs,
    totalVendeursActifs,
    totalBoutiques,
    totalBoutiquesActives,
    totalProduits,
    totalCommandes,
    totalVentesGlobales,
    revenuTotal,
    revenuMensuel,
    vendeursRecents,
    paiementsRecents,
    logsRecents,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.vendeur.count(),
    prisma.vendeur.count({ where: { statut: "ACTIF" } }),
    prisma.boutique.count(),
    prisma.boutique.count({ where: { statut: "ACTIF" } }),
    prisma.produit.count(),
    prisma.commandeClient.count(),
    prisma.commandeClient.aggregate({ _sum: { total: true } }),
    prisma.paiement.aggregate({
      where: { statut: "CONFIRME" },
      _sum: { montant: true },
    }),
    prisma.paiement.aggregate({
      where: {
        statut: "CONFIRME",
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { montant: true },
    }),
    prisma.vendeur.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { boutiques: true } } },
    }),
    prisma.paiement.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        abonnement: {
          include: {
            vendeur: true,
            plan: true,
          },
        },
      },
    }),
    prisma.activityLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  return {
    totalUsers,
    totalVendeurs,
    totalVendeursActifs,
    totalBoutiques,
    totalBoutiquesActives,
    totalProduits,
    totalCommandes,
    totalVentesGlobales: totalVentesGlobales._sum.total ?? 0,
    revenuTotal: revenuTotal._sum.montant ?? 0,
    revenuMensuel: revenuMensuel._sum.montant ?? 0,
    vendeursRecents,
    paiementsRecents,
    logsRecents,
  };
}

export async function getAllVendeurs(params?: {
  search?: string;
  page?: number;
  perPage?: number;
}) {
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 20;

  const where = {
    ...(params?.search && {
      OR: [
        { nom: { contains: params.search, mode: "insensitive" as const } },
        { prenom: { contains: params.search, mode: "insensitive" as const } },
        { email: { contains: params.search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.vendeur.findMany({
      where,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        statut: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        _count: { select: { boutiques: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.vendeur.count({ where }),
  ]);

  return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function getAllBoutiques(params?: {
  search?: string;
  page?: number;
  perPage?: number;
}) {
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 20;

  const where = {
    ...(params?.search && {
      nom: { contains: params.search, mode: "insensitive" as const },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.boutique.findMany({
      where,
      include: {
        vendeur: { select: { id: true, nom: true, prenom: true } },
        _count: { select: { produits: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.boutique.count({ where }),
  ]);

  return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function getActivityLogs(params?: {
  page?: number;
  perPage?: number;
  action?: string;
}) {
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 50;

  const where = {
    ...(params?.action && { action: params.action }),
  };

  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}
