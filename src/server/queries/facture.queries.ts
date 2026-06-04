import { prisma } from "@/lib/prisma";
import type { FactureStatut } from "@/schemas/facture.schema";

export interface FactureListFilters {
  statut?: FactureStatut;
  search?: string;
}

/** Liste des factures d'une boutique, filtrable par statut + recherche. */
export async function getFacturesForBoutique(
  boutiqueId: string,
  filters: FactureListFilters = {}
) {
  const search = filters.search?.trim();
  return prisma.facture.findMany({
    where: {
      boutiqueId,
      ...(filters.statut ? { statut: filters.statut } : {}),
      ...(search
        ? {
            OR: [
              { numero: { contains: search, mode: "insensitive" } },
              { clientNom: { contains: search, mode: "insensitive" } },
              { clientTelephone: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      numero: true,
      date: true,
      statut: true,
      clientNom: true,
      clientTelephone: true,
      total: true,
      stockDeduit: true,
      _count: { select: { lignes: true } },
    },
    orderBy: { date: "desc" },
  });
}

/** Agrégats par statut pour les cartes d'en-tête. */
export async function getFactureStats(boutiqueId: string) {
  const [grouped, payeeAgg] = await Promise.all([
    prisma.facture.groupBy({
      by: ["statut"],
      where: { boutiqueId },
      _count: { _all: true },
    }),
    prisma.facture.aggregate({
      where: { boutiqueId, statut: "PAYEE" },
      _sum: { total: true },
    }),
  ]);

  const counts: Record<string, number> = {
    BROUILLON: 0,
    PAYEE: 0,
    IMPAYEE: 0,
    ANNULEE: 0,
  };
  for (const g of grouped) counts[g.statut] = g._count._all;

  return {
    total: Object.values(counts).reduce((a, b) => a + b, 0),
    counts,
    montantPaye: payeeAgg._sum.total ?? 0,
  };
}

/** Facture complète (lignes + boutique + client) pour l'aperçu / PDF. */
export async function getFactureById(boutiqueId: string, factureId: string) {
  return prisma.facture.findFirst({
    where: { id: factureId, boutiqueId },
    include: {
      lignes: true,
      client: true,
      boutique: {
        select: {
          nom: true,
          logo: true,
          telephone: true,
          email: true,
          adresse: true,
        },
      },
    },
  });
}

/** Données nécessaires au formulaire de création (clients + produits). */
export async function getFactureFormData(boutiqueId: string) {
  const [clients, produits] = await Promise.all([
    prisma.client.findMany({
      where: { boutiqueId },
      select: { id: true, nom: true, prenom: true, telephone: true, email: true, adresse: true },
      orderBy: { nom: "asc" },
    }),
    prisma.produit.findMany({
      where: { boutiqueId },
      select: { id: true, nom: true, prixUnitaire: true, quantite: true, code: true },
      orderBy: { nom: "asc" },
    }),
  ]);
  return { clients, produits };
}
