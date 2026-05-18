"use server";

import { prisma } from "@/lib/prisma";

export async function getBoutiqueCategories(boutiqueId: string) {
  return prisma.categorie.findMany({
    where: { boutiqueId },
    include: { _count: { select: { produits: true } } },
    orderBy: { nom: "asc" },
  });
}
