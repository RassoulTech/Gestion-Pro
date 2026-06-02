"use server";

import { prisma } from "@/lib/prisma";
import type { SecteurActivite, Prisma } from "@prisma/client";
import { marketplaceAccessFilter } from "./marketplace-access";

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
    where: {
      slug,
      statut: "ACTIF",
      ...marketplaceAccessFilter(),
    },
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
      slug: true,
      statut: true,
      description: true,
      adresse: true,
      siteWeb: true,
      email: true,
      telephone: true,
      secteurActivite: true,
      logo: true,
      latitude: true,
      longitude: true,
      whatsapp: true,
      facebook: true,
      instagram: true,
      linkedin: true,
      twitter: true,
      horaires: true,
    },
  });
}

export async function getVendeurForSettings(userId: string) {
  const vendeur = await prisma.vendeur.findUnique({
    where: { userId },
    select: {
      id: true,
      nom: true,
      prenom: true,
      nomAffiche: true,
      email: true,
      telephone: true,
      pays: true,
      ville: true,
      adresse: true,
      bio: true,
      photo: true,
      notifications: true,
      preferences: true,
      user: {
        select: {
          id: true,
          email: true,
          password: true,
          updatedAt: true,
          createdAt: true,
        },
      },
    },
  });
  if (!vendeur) return null;
  const { user, ...rest } = vendeur;
  return {
    ...rest,
    user: {
      id: user.id,
      email: user.email,
      hasPassword: !!user.password,
      updatedAt: user.updatedAt,
      createdAt: user.createdAt,
    },
  };
}

export async function getRecentActivityForUser(userId: string, limit = 8) {
  return prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      subjectType: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
    },
  });
}

export async function getCommandeCountForBoutique(boutiqueId: string) {
  return prisma.commandeClient.count({ where: { boutiqueId } });
}

export async function getPublicBoutiques(params?: {
  search?: string;
  secteur?: SecteurActivite;
  page?: number;
  perPage?: number;
}) {
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 12;

  const where: Prisma.BoutiqueWhereInput = {
    statut: "ACTIF" as const,
    ...marketplaceAccessFilter(),
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
