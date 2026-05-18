"use server";

import { prisma } from "@/lib/prisma";

export async function getBoutiqueClients(
  boutiqueId: string,
  params?: { search?: string; page?: number; perPage?: number }
) {
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 20;

  const where = {
    boutiqueId,
    ...(params?.search && {
      OR: [
        { nom: { contains: params.search, mode: "insensitive" as const } },
        { prenom: { contains: params.search, mode: "insensitive" as const } },
        { telephone: { contains: params.search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: { _count: { select: { commandes: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.client.count({ where }),
  ]);

  return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}
