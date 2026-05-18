"use server";

import { prisma } from "@/lib/prisma";
import type { TypeMouvement } from "@prisma/client";

export async function getMouvementsStock(
  boutiqueId: string,
  params?: {
    type?: TypeMouvement;
    page?: number;
    perPage?: number;
  }
) {
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 20;

  const where = {
    boutiqueId,
    ...(params?.type && { type: params.type }),
  };

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
