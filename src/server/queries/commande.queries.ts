"use server";

import { prisma } from "@/lib/prisma";
import type { EtatCommande } from "@prisma/client";

export async function getBoutiqueCommandes(
  boutiqueId: string,
  params?: {
    etat?: EtatCommande;
    search?: string;
    page?: number;
    perPage?: number;
  }
) {
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 20;

  const where = {
    boutiqueId,
    ...(params?.etat && { etat: params.etat }),
    ...(params?.search && {
      code: { contains: params.search, mode: "insensitive" as const },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.commandeClient.findMany({
      where,
      include: {
        client: { select: { nom: true, prenom: true } },
        _count: { select: { lignes: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.commandeClient.count({ where }),
  ]);

  return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function getCommandeById(
  boutiqueId: string,
  commandeId: string
) {
  return prisma.commandeClient.findFirst({
    where: { id: commandeId, boutiqueId },
    include: {
      client: true,
      lignes: {
        include: { produit: { select: { nom: true, code: true, photo: true } } },
      },
    },
  });
}

export async function getBoutiqueVentesFlash(
  boutiqueId: string,
  params?: { page?: number; perPage?: number }
) {
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 20;

  const [data, total] = await Promise.all([
    prisma.venteFlash.findMany({
      where: { boutiqueId },
      include: { _count: { select: { lignes: true } } },
      orderBy: { date: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.venteFlash.count({ where: { boutiqueId } }),
  ]);

  return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function getBoutiqueCommandesFournisseur(
  boutiqueId: string,
  params?: { search?: string; page?: number; perPage?: number; dateFilter?: any }
) {
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 20;

  const where = {
    boutiqueId,
    ...(params?.search && {
      OR: [
        { code: { contains: params.search, mode: "insensitive" as const } },
        { fournisseur: { nom: { contains: params.search, mode: "insensitive" as const } } },
      ],
    }),
    ...(params?.dateFilter && {
      date: params.dateFilter,
    }),
  };

  const [data, total] = await Promise.all([
    prisma.commandeFournisseur.findMany({
      where,
      include: {
        fournisseur: { select: { nom: true } },
        _count: { select: { lignes: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.commandeFournisseur.count({ where }),
  ]);

  return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}
