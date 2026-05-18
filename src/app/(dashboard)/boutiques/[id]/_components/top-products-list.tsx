import { prisma } from "@/lib/prisma";
import { Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

/**
 * Liste des 5 produits les plus vendus du mois.
 * Agrégation côté Prisma sur lignes_commande_client.
 */
export async function TopProductsList({ boutiqueId }: { boutiqueId: string }) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const lignes = await prisma.ligneCommandeClient.findMany({
    where: {
      commande: {
        boutiqueId,
        date: { gte: startOfMonth },
        etat: { in: ["VALIDEE", "LIVREE"] },
      },
    },
    include: { produit: { select: { id: true, nom: true, prixUnitaire: true } } },
  });

  const agg = new Map<string, { nom: string; quantite: number; ca: number }>();
  for (const l of lignes) {
    const cur = agg.get(l.produitId) ?? {
      nom: l.produit.nom,
      quantite: 0,
      ca: 0,
    };
    cur.quantite += l.quantite;
    cur.ca += l.quantite * l.prixUnitaire;
    agg.set(l.produitId, cur);
  }

  const top = Array.from(agg.values())
    .sort((a, b) => b.quantite - a.quantite)
    .slice(0, 5);

  if (top.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aucune vente ce mois-ci.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {top.map((p, i) => (
        <li key={i} className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{p.nom}</p>
              <p className="text-xs text-muted-foreground">
                <Package className="mr-1 inline h-3 w-3" />
                {p.quantite} vendus
              </p>
            </div>
          </div>
          <span className="shrink-0 text-sm font-medium tabular-nums">
            {formatCurrency(p.ca)}
          </span>
        </li>
      ))}
    </ul>
  );
}
