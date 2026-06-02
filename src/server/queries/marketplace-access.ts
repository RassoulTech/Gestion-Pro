import type { Prisma } from "@prisma/client";
import { env } from "@/env.mjs";

/**
 * Renvoie un fragment Prisma `where` qui restreint la visibilité publique
 * d'une boutique au plan PRO ou ENTERPRISE actif (essai ou payant).
 *
 * Vérifie aussi les dates d'expiration (essaiFin / dateFin) en plus du statut
 * enum — le cron expire-trials peut tarder à marquer EXPIRE, donc on ne se fie
 * pas seulement à statut pour éviter d'exposer une boutique dont le trial est
 * en fait fini depuis plusieurs heures.
 *
 * En mode sandbox (BILLING_ENABLED ≠ "true"), aucun filtre n'est ajouté.
 *
 * Module partagé (sans "use server") pour être réutilisé à la fois par les
 * queries boutiques et la query produits du marketplace.
 */
export function marketplaceAccessFilter(): Prisma.BoutiqueWhereInput {
  if (process.env.BILLING_ENABLED !== "true" && env.BILLING_ENABLED !== "true") {
    return {};
  }
  const now = new Date();
  return {
    membres: {
      some: {
        role: "OWNER",
        vendeur: {
          abonnements: {
            some: {
              plan: { codePlan: { in: ["PRO", "ENTERPRISE"] } },
              OR: [
                {
                  statut: "ACTIF",
                  OR: [{ dateFin: null }, { dateFin: { gt: now } }],
                },
                {
                  statut: "ESSAI",
                  OR: [{ essaiFin: null }, { essaiFin: { gt: now } }],
                },
              ],
            },
          },
        },
      },
    },
  };
}
