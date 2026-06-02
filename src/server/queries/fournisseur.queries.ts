"use server";

import { prisma } from "@/lib/prisma";

export async function getBoutiqueFournisseurs(
  boutiqueId: string,
  params?: { search?: string; page?: number; perPage?: number; dateFilter?: any }
) {
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 20;

  const where = {
    boutiqueId,
    ...(params?.search && {
      nom: { contains: params.search, mode: "insensitive" as const },
    }),
    ...(params?.dateFilter && {
      createdAt: params.dateFilter,
    }),
  };

  const [data, total] = await Promise.all([
    prisma.fournisseur.findMany({
      where,
      include: { _count: { select: { commandes: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.fournisseur.count({ where }),
  ]);

  return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

