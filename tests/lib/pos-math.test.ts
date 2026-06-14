import { describe, it, expect } from "vitest";
import { lineItemsTotal, computePosTotals } from "@/lib/pos-math";

describe("lineItemsTotal", () => {
  it("somme prixUnitaire × quantité sur toutes les lignes", () => {
    expect(
      lineItemsTotal([
        { prixUnitaire: 1500, quantite: 2 },
        { prixUnitaire: 500, quantite: 3 },
      ])
    ).toBe(4500);
  });

  it("renvoie 0 pour un panier vide", () => {
    expect(lineItemsTotal([])).toBe(0);
  });
});

describe("computePosTotals", () => {
  const lines = [
    { prixUnitaire: 10000, quantite: 2 }, // 20 000
    { prixUnitaire: 5000, quantite: 1 }, // 5 000
  ];

  it("calcule subtotal et total sans remise", () => {
    const r = computePosTotals({ lines });
    expect(r.subtotal).toBe(25000);
    expect(r.total).toBe(25000);
    expect(r.monnaieRendue).toBe(0);
  });

  it("applique la remise sur le total", () => {
    const r = computePosTotals({ lines, remise: 5000 });
    expect(r.total).toBe(20000);
  });

  it("borne le total à 0 quand la remise dépasse le sous-total", () => {
    const r = computePosTotals({ lines, remise: 999999 });
    expect(r.total).toBe(0);
    expect(r.subtotal).toBe(25000);
  });

  it("calcule la monnaie rendue quand le reçu dépasse le total", () => {
    const r = computePosTotals({ lines, montantRecu: 30000 });
    expect(r.monnaieRendue).toBe(5000);
  });

  it("ne rend pas de monnaie si le reçu est insuffisant", () => {
    const r = computePosTotals({ lines, montantRecu: 20000 });
    expect(r.monnaieRendue).toBe(0);
  });

  it("ne rend pas de monnaie si le reçu égale exactement le total", () => {
    const r = computePosTotals({ lines, montantRecu: 25000 });
    expect(r.monnaieRendue).toBe(0);
  });

  it("calcule la monnaie sur le total APRÈS remise", () => {
    const r = computePosTotals({ lines, remise: 5000, montantRecu: 25000 });
    expect(r.total).toBe(20000);
    expect(r.monnaieRendue).toBe(5000);
  });

  it("gère un panier vide", () => {
    const r = computePosTotals({ lines: [] });
    expect(r).toEqual({ subtotal: 0, total: 0, monnaieRendue: 0 });
  });

  it("montantRecu undefined ne produit aucune monnaie", () => {
    const r = computePosTotals({ lines, montantRecu: undefined });
    expect(r.monnaieRendue).toBe(0);
  });
});
