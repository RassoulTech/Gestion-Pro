"use server";

import { prisma } from "@/lib/prisma";
import { subMonths, startOfMonth, format, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { unstable_noStore as noStore } from "next/cache";

export async function getAdminStats() {
  noStore();
  const [
    totalUsers,
    verifiedUsers,
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
    prisma.user.count({ where: { emailVerified: { not: null } } }),
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
    verifiedUsers,
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
  noStore();
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 20;

  const where = {
    boutiques: { some: {} },
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
        userId: true,
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

export async function getAllUsersWithoutShop(params?: {
  search?: string;
  page?: number;
  perPage?: number;
}) {
  noStore();
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 20;

  const where = {
    // Only fetch users who either don't have a Vendeur profile,
    // OR have a Vendeur profile but 0 boutiques.
    // Also exclude ADMIN role if we only want regular users/vendeurs.
    role: { not: "ADMIN" as const },
    OR: [
      { vendeur: null },
      { vendeur: { boutiques: { none: {} } } }
    ],
    ...(params?.search && {
      OR: [
        { name: { contains: params.search, mode: "insensitive" as const } },
        { email: { contains: params.search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        emailVerified: true,
        vendeur: {
          select: {
            id: true,
            statut: true,
            createdAt: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function getAllBoutiques(params?: {
  search?: string;
  page?: number;
  perPage?: number;
}) {
  noStore();
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
        vendeur: { select: { id: true, nom: true, prenom: true, email: true } },
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
  noStore();
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

export async function getPlatformGrowthStats() {
  noStore();
  const result = [];
  
  // Last 5 months including current
  for (let i = 4; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    const [inscriptions, revenus] = await Promise.all([
      prisma.vendeur.count({
        where: {
          createdAt: {
            gte: start,
            lte: end
          }
        }
      }),
      prisma.paiement.aggregate({
        where: {
          statut: "CONFIRME",
          createdAt: {
            gte: start,
            lte: end
          }
        },
        _sum: {
          montant: true
        }
      })
    ]);
    
    result.push({
      name: format(start, "MMM", { locale: fr }),
      Revenus: revenus._sum.montant || 0,
      Inscriptions: inscriptions
    });
  }
  
  return result;
}

export async function getAdvancedAnalytics() {
  noStore();
  const result = [];
  
  // Last 5 months including current
  for (let i = 4; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    // Total users created this month (excluding ADMINs)
    const totalUsers = await prisma.user.count({
      where: {
        createdAt: { gte: start, lte: end },
        role: { not: "ADMIN" }
      }
    });

    // Users who have NO vendeur profile created this month
    const usersWithoutVendeur = await prisma.user.count({
      where: {
        createdAt: { gte: start, lte: end },
        vendeur: null,
        role: { not: "ADMIN" }
      }
    });

    // Vendeurs created this month with NO boutiques
    const vendeursWithoutBoutique = await prisma.vendeur.count({
      where: {
        createdAt: { gte: start, lte: end },
        boutiques: { none: {} }
      }
    });

    const sansBoutique = usersWithoutVendeur + vendeursWithoutBoutique;

    // Get all abonnements created this month that are active or essai
    const abonnementsThisMonth = await prisma.abonnement.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        statut: { in: ["ACTIF", "ESSAI"] }
      },
      include: {
        plan: true
      }
    });

    let gratuit = 0;
    let pro = 0;
    let enterprise = 0;

    abonnementsThisMonth.forEach((ab) => {
      const planName = ab.plan.nom.toLowerCase();
      if (planName.includes("pro")) {
        pro++;
      } else if (planName.includes("enterprise") || planName.includes("entreprise")) {
        enterprise++;
      } else {
        // "Starter" or "Gratuit"
        gratuit++;
      }
    });
    
    result.push({
      name: format(start, "MMM", { locale: fr }),
      totalUsers,
      sansBoutique,
      gratuit,
      pro,
      enterprise
    });
  }
  
  return result;
}
