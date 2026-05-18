"use server";

import { prisma } from "@/lib/prisma";
import type { SecteurActivite } from "@prisma/client";

export async function getVendeurBoutiques(vendeurId: string) {
  return prisma.boutique.findMany({
    where: {
      membres: { some: { vendeurId } },
    },
    include: {
      _count: { select: { produits: true, clients: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBoutiqueById(boutiqueId: string) {
  return prisma.boutique.findUnique({
    where: { id: boutiqueId },
    include: {
      vendeur: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          user: { select: { name: true, email: true } }
        }
      },
      _count: {
        select: { produits: true, clients: true, fournisseurs: true },
      },
    },
  });
}

export async function getBoutiqueBySlug(slug: string) {
  return prisma.boutique.findFirst({
    where: { slug, statut: "ACTIF" },
    include: {
      vendeur: { select: { photo: true } },
      categories: true,
      produits: {
        where: { quantite: { gt: 0 } },
        include: { categorie: true },
        orderBy: { nom: "asc" },
      },
    },
  });
}

export async function getBoutiqueForSettings(boutiqueId: string) {
  return prisma.boutique.findUnique({
    where: { id: boutiqueId },
    select: {
      id: true,
      nom: true,
      description: true,
      adresse: true,
      siteWeb: true,
      email: true,
      telephone: true,
      secteurActivite: true,
      logo: true,
      latitude: true,
      longitude: true,
    },
  });
}

export async function getPublicBoutiques(params?: {
  search?: string;
  secteur?: SecteurActivite;
  page?: number;
  perPage?: number;
}) {
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 12;

  const where = {
    statut: "ACTIF" as const,
    ...(params?.search && {
      nom: { contains: params.search, mode: "insensitive" as const },
    }),
    ...(params?.secteur && { secteurActivite: params.secteur }),
  };

  const [data, total] = await Promise.all([
    prisma.boutique.findMany({
      where,
      include: {
        _count: { select: { produits: true } },
        vendeur: { select: { photo: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.boutique.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}
