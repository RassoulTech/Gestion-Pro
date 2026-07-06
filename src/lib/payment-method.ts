/**
 * Libellés FRANÇAIS des moyens de paiement — source unique pour la facture PDF,
 * les fiches commande et les e-mails. Couvre les codes marketplace
 * (WAVE/ORANGE_MONEY/CASH_ON_DELIVERY), la caisse (ESPECES/MOBILE_MONEY/CARTE/
 * AUTRE) et la passerelle (PAYTECH + libellés bruts renvoyés par l'IPN).
 */
const LABELS: Record<string, string> = {
  WAVE: "Wave",
  ORANGE_MONEY: "Orange Money",
  CASH_ON_DELIVERY: "Paiement à la livraison",
  ESPECES: "Espèces",
  MOBILE_MONEY: "Mobile Money",
  CARTE: "Carte bancaire",
  AUTRE: "Autre",
  PAYTECH: "Paiement en ligne",
};

export function paymentMethodLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  const key = code.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (LABELS[key]) return LABELS[key];
  // Codes bruts PayTech du type "Orange Money", "Wave", "Carte Bancaire", etc.
  if (key.includes("WAVE")) return "Wave";
  if (key.includes("ORANGE")) return "Orange Money";
  if (key.includes("CARTE") || key.includes("CARD")) return "Carte bancaire";
  return code;
}
