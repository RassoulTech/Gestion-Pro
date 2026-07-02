"use server";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma, SecteurActivite } from "@prisma/client";
import { marketplaceAccessFilter } from "./marketplace-access";

export type MarketplaceSort = "recent" | "popular" | "price_asc" | "price_desc";
export type MarketplaceDispo = "stock" | "rupture";

export interface MarketplaceProductsParams {
  search?: string;
  secteur?: SecteurActivite;
  categorie?: string;
  boutiqueSlug?: string;
  prixMin?: number;
  prixMax?: number;
  dispo?: MarketplaceDispo;
  sort?: MarketplaceSort;
  page?: number;
  perPage?: number;
}

/**
 * Query produits du marketplace orienté produits.
 *
 * Tout est fait côté serveur : filtres + tri + pagination (skip/take).
 * On ne charge jamais l'intégralité du catalogue pour filtrer côté client.
 */
export async function getMarketplaceProducts(params?: MarketplaceProductsParams) {
  // ⚡ Perf : le filtre d'accès marketplace fait des jointures profondes
  // (Boutique→Membre→Vendeur→Abonnement→Plan). On met le RÉSULTAT en cache 60 s
  // (clé = filtres), donc les requêtes répétées ne refont pas ces jointures. Les
  // données marketplace tolèrent 60 s de fraîcheur. Invalidable via le tag "marketplace".
  return unstable_cache(
    () => queryMarketplaceProducts(params),
    ["marketplace-products", JSON.stringify(params ?? {})],
    { revalidate: 60, tags: ["marketplace"] }
  )();
}

async function queryMarketplaceProducts(params?: MarketplaceProductsParams) {
  const page = Math.max(1, params?.page ?? 1);
  const perPage = params?.perPage ?? 20;

  // Restriction de visibilité : seules les boutiques actives + plan éligible
  const boutiqueFilter: Prisma.BoutiqueWhereInput = {
    statut: "ACTIF",
    ...marketplaceAccessFilter(),
    ...(params?.secteur && { secteurActivite: params.secteur }),
    ...(params?.boutiqueSlug && { slug: params.boutiqueSlug }),
  };

  const where: Prisma.ProduitWhereInput = {
    boutique: { is: boutiqueFilter },
    ...(params?.categorie && {
      categorie: { is: { nom: { equals: params.categorie, mode: "insensitive" } } },
    }),
    ...(params?.dispo === "stock" && { quantite: { gt: 0 } }),
    ...(params?.dispo === "rupture" && { quantite: { equals: 0 } }),
    ...((params?.prixMin != null || params?.prixMax != null) && {
      prixUnitaire: {
        ...(params?.prixMin != null && { gte: params.prixMin }),
        ...(params?.prixMax != null && { lte: params.prixMax }),
      },
    }),
    ...(params?.search && {
      OR: [
        { nom: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
        { categorie: { is: { nom: { contains: params.search, mode: "insensitive" } } } },
        { boutique: { is: { nom: { contains: params.search, mode: "insensitive" } } } },
      ],
    }),
  };

  const orderBy: Prisma.ProduitOrderByWithRelationInput =
    params?.sort === "price_asc"
      ? { prixUnitaire: "asc" }
      : params?.sort === "price_desc"
        ? { prixUnitaire: "desc" }
        : params?.sort === "popular"
          ? { lignesCommandeClient: { _count: "desc" } }
          : { createdAt: "desc" };

  const [data, total] = await Promise.all([
    prisma.produit.findMany({
      where,
      select: {
        id: true,
        nom: true,
        description: true,
        prixUnitaire: true,
        quantite: true,
        photo: true,
        createdAt: true,
        categorie: { select: { nom: true } },
        boutique: {
          select: {
            nom: true,
            slug: true,
            logo: true,
            adresse: true,
            telephone: true,
            whatsapp: true,
            secteurActivite: true,
            vendeur: { select: { photo: true } },
          },
        },
      },
      orderBy,
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

export type MarketplaceProduct = Awaited<
  ReturnType<typeof getMarketplaceProducts>
>["data"][number];

/**
 * Options légères pour alimenter les filtres (catégories + boutiques visibles).
 * Restreint aux boutiques publiquement visibles.
 */
export async function getMarketplaceFilterOptions() {
  // ⚡ Perf : options de filtres (catégories + boutiques) stables → cache 5 min.
  // Retire 2 requêtes du chemin critique du marketplace à chaque chargement répété.
  return unstable_cache(queryMarketplaceFilterOptions, ["marketplace-filter-options"], {
    revalidate: 300,
    tags: ["marketplace"],
  })();
}

async function queryMarketplaceFilterOptions() {
  const boutiqueFilter: Prisma.BoutiqueWhereInput = {
    statut: "ACTIF",
    ...marketplaceAccessFilter(),
  };

  const [categories, boutiques] = await Promise.all([
    prisma.categorie.findMany({
      where: { boutique: { is: boutiqueFilter }, produits: { some: {} } },
      select: { nom: true },
      distinct: ["nom"],
      orderBy: { nom: "asc" },
    }),
    prisma.boutique.findMany({
      where: { ...boutiqueFilter, produits: { some: {} } },
      select: { slug: true, nom: true },
      orderBy: { nom: "asc" },
    }),
  ]);

  return {
    categories: categories.map((c) => c.nom),
    boutiques,
  };
}
