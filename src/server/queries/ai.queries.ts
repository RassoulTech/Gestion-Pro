import "server-only";

import { prisma } from "@/lib/prisma";

/** Historique des générations IA d'un vendeur pour une boutique. */
export async function getAiHistory(userId: string, boutiqueId: string, limit = 30) {
  return prisma.aiGeneration.findMany({
    where: { userId, boutiqueId },
    select: { id: true, type: true, prompt: true, response: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export interface BoutiqueAiContext {
  boutiqueNom: string;
  totalProduits: number;
  totalClients: number;
  ventesMois: number;
  nbCommandesMois: number;
  topProduits: { nom: string; qte: number }[];
  stockFaible: { nom: string; quantite: number; seuil: number }[];
  topClients: { nom: string; total: number }[];
}

/** Instantané compact des données réelles de la boutique (pour le chat IA). */
export async function getBoutiqueAiContext(boutiqueId: string): Promise<BoutiqueAiContext> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [boutique, totalProduits, totalClients, ventesAgg, topLignes, produits, topClientsAgg] = await Promise.all([
    prisma.boutique.findUnique({ where: { id: boutiqueId }, select: { nom: true } }),
    prisma.produit.count({ where: { boutiqueId } }),
    prisma.client.count({ where: { boutiqueId } }),
    prisma.commandeClient.aggregate({
      where: { boutiqueId, etat: { not: "ANNULEE" }, date: { gte: startOfMonth } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.ligneCommandeClient.groupBy({
      by: ["produitId"],
      where: { commande: { boutiqueId, etat: { in: ["VALIDEE", "LIVREE"] } } },
      _sum: { quantite: true },
      orderBy: { _sum: { quantite: "desc" } },
      take: 5,
    }),
    prisma.produit.findMany({
      where: { boutiqueId },
      select: { nom: true, quantite: true, seuilAlerte: true },
    }),
    prisma.commandeClient.groupBy({
      by: ["clientId"],
      where: { boutiqueId, etat: { not: "ANNULEE" }, clientId: { not: null } },
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 3,
    }),
  ]);

  // Noms des top produits
  const produitIds = topLignes.map((l) => l.produitId);
  const produitNoms = produitIds.length
    ? await prisma.produit.findMany({ where: { id: { in: produitIds } }, select: { id: true, nom: true } })
    : [];
  const nameById = new Map(produitNoms.map((p) => [p.id, p.nom]));
  const topProduits = topLignes.map((l) => ({
    nom: nameById.get(l.produitId) ?? "Produit",
    qte: l._sum.quantite ?? 0,
  }));

  // Noms des top clients
  const clientIds = topClientsAgg.map((c) => c.clientId).filter((id): id is string => !!id);
  const clientNoms = clientIds.length
    ? await prisma.client.findMany({ where: { id: { in: clientIds } }, select: { id: true, nom: true, prenom: true } })
    : [];
  const clientById = new Map(clientNoms.map((c) => [c.id, [c.prenom, c.nom].filter(Boolean).join(" ").trim() || c.nom]));
  const topClients = topClientsAgg.map((c) => ({
    nom: c.clientId ? clientById.get(c.clientId) ?? "Client" : "Client",
    total: c._sum.total ?? 0,
  }));

  const stockFaible = produits
    .filter((p) => p.quantite <= p.seuilAlerte)
    .sort((a, b) => a.quantite - b.quantite)
    .slice(0, 8)
    .map((p) => ({ nom: p.nom, quantite: p.quantite, seuil: p.seuilAlerte }));

  return {
    boutiqueNom: boutique?.nom ?? "Boutique",
    totalProduits,
    totalClients,
    ventesMois: ventesAgg._sum.total ?? 0,
    nbCommandesMois: ventesAgg._count._all,
    topProduits,
    stockFaible,
    topClients,
  };
}

/** Formate l'instantané en bloc texte injecté dans le prompt système du chat. */
export function formatAiContext(c: BoutiqueAiContext): string {
  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
  return [
    `Boutique : ${c.boutiqueNom}`,
    `Produits au catalogue : ${c.totalProduits}`,
    `Clients enregistrés : ${c.totalClients}`,
    `Ventes ce mois-ci : ${fmt(c.ventesMois)} sur ${c.nbCommandesMois} commande(s)`,
    `Meilleures ventes : ${c.topProduits.map((p) => `${p.nom} (${p.qte} vendus)`).join(", ") || "aucune donnée"}`,
    `Stock faible / rupture : ${c.stockFaible.map((p) => `${p.nom} (${p.quantite} restant)`).join(", ") || "aucun"}`,
    `Meilleurs clients : ${c.topClients.map((cl) => `${cl.nom} (${fmt(cl.total)})`).join(", ") || "aucune donnée"}`,
  ].join("\n");
}
