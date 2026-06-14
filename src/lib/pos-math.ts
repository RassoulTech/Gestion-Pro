/**
 * Calculs monétaires de la caisse (POS) et des paniers — fonctions pures,
 * sans dépendance React/Prisma, pour être testables unitairement.
 *
 * La même formule de total de lignes est utilisée par la caisse et par le
 * checkout marketplace (somme `prixUnitaire × quantité`).
 */

export interface LineItem {
  prixUnitaire: number;
  quantite: number;
}

/** Somme des lignes : Σ prixUnitaire × quantité. */
export function lineItemsTotal(lines: LineItem[]): number {
  return lines.reduce((sum, l) => sum + l.prixUnitaire * l.quantite, 0);
}

export interface PosTotalsInput {
  lines: LineItem[];
  /** Remise en valeur absolue (FCFA). */
  remise?: number;
  /** Montant reçu du client (pour la monnaie rendue). */
  montantRecu?: number;
}

export interface PosTotals {
  subtotal: number;
  total: number;
  monnaieRendue: number;
}

/**
 * Totaux de la caisse :
 * - `subtotal` = somme des lignes
 * - `total` = subtotal − remise, borné à 0 (une remise ne rend jamais négatif)
 * - `monnaieRendue` = reçu − total, uniquement si le reçu dépasse le total
 */
export function computePosTotals({
  lines,
  remise = 0,
  montantRecu,
}: PosTotalsInput): PosTotals {
  const subtotal = lineItemsTotal(lines);
  const total = Math.max(0, subtotal - remise);
  const monnaieRendue =
    montantRecu !== undefined && montantRecu > total ? montantRecu - total : 0;
  return { subtotal, total, monnaieRendue };
}
