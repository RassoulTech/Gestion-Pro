"use server";

import { prisma } from "@/lib/prisma";

export async function getBoutiqueProduits(
  boutiqueId: string,
  params?: {
    search?: string;
    categorieId?: string;
    page?: number;
    perPage?: number;
  }
) {
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 20;

  const where = {
    boutiqueId,
    ...(params?.search && {
      OR: [
        { nom: { contains: params.search, mode: "insensitive" as const } },
        { code: { contains: params.search, mode: "insensitive" as const } },
      ],
    }),
    ...(params?.categorieId && { categorieId: params.categorieId }),
  };

  const [data, total] = await Promise.all([
    prisma.produit.findMany({
      where,
      include: { categorie: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.produit.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getProduitById(boutiqueId: string, produitId: string) {
  return prisma.produit.findFirst({
    where: { id: produitId, boutiqueId },
    include: { categorie: true },
  });
}

export async function getProduitsEnAlerte(boutiqueId: string) {
  return prisma.produit.findMany({
    where: {
      boutiqueId,
      quantite: { lte: prisma.produit.fields.seuilAlerte },
    },
    include: { categorie: true },
    orderBy: { quantite: "asc" },
    take: 20,
  });
}

export async function getProduitsAlertStock(boutiqueId: string) {
  // Using raw comparison since Prisma doesn't support field-to-field comparison easily
  return prisma.$queryRaw`
    SELECT p.*, c.nom as categorie_nom
    FROM produits p
    LEFT JOIN categories c ON p.categorie_id = c.id
    WHERE p.boutique_id = ${boutiqueId}
    AND p.quantite <= p.seuil_alerte
    ORDER BY p.quantite ASC
    LIMIT 20
  `;
}
