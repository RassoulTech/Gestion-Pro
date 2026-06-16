"use server";

import { prisma } from "@/lib/prisma";

export async function getMouvementsStock(
  boutiqueId: string,
  params?: {
    type?: string;
    page?: number;
    perPage?: number;
    search?: string;
    dateFilter?: any;
    source?: string;
  }
) {
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 20;

  const where: any = {
    boutiqueId,
  };

  if (params?.type && params.type !== "ALL") {
    where.type = params.type;
  }

  if (params?.source && params.source !== "ALL") {
    where.sourceType = params.source;
  }

  if (params?.search) {
    where.OR = [
      { produit: { nom: { contains: params.search, mode: "insensitive" } } },
      { produit: { code: { contains: params.search, mode: "insensitive" } } },
      { sourceType: { contains: params.search, mode: "insensitive" } },
    ];
  }

  if (params?.dateFilter) {
    where.date = params.dateFilter;
  }

  const [data, total] = await Promise.all([
    prisma.mouvementStock.findMany({
      where,
      include: { produit: { select: { nom: true, code: true } } },
      orderBy: { date: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.mouvementStock.count({ where }),
  ]);

  return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function getBoutiqueDepenses(
  boutiqueId: string,
  params?: { page?: number; perPage?: number }
) {
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 20;

  const [data, total, totalMontant] = await Promise.all([
    prisma.depense.findMany({
      where: { boutiqueId },
      orderBy: { date: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.depense.count({ where: { boutiqueId } }),
    prisma.depense.aggregate({
      where: {
        boutiqueId,
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { montant: true },
    }),
  ]);

  return {
    data,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
    totalMontantMois: totalMontant._sum.montant ?? 0,
  };
}
