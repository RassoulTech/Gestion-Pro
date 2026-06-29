import { env } from "@/env.mjs";

/**
 * Normalise un numéro de téléphone pour WhatsApp.
 * Supprime les espaces, parenthèses, tirets, et le préfixe "+".
 * Conserve uniquement les chiffres. Retourne null si invalide.
 */
export function normalizeWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d]/g, ""); // Supprime tout ce qui n'est pas un chiffre
  if (cleaned.length < 7 || cleaned.length > 15) return null; // Longueur standard E.164
  return cleaned;
}

/**
 * Met un numéro au format international (E.164 sans « + ») pour wa.me.
 * - Supprime tout sauf les chiffres ; gère le préfixe "00".
 * - Si le numéro est local (≤ 9 chiffres, sans indicatif), préfixe l'indicatif
 *   pays par défaut (Sénégal `221`). Sinon il est supposé déjà international.
 * Retourne null si le résultat n'a pas une longueur plausible.
 */
export function internationalizeNumber(
  phone: string | null | undefined,
  defaultCountryCode = "221"
): string | null {
  if (!phone) return null;
  let d = phone.replace(/[^\d]/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (!d) return null;
  if (!d.startsWith(defaultCountryCode) && d.length <= 9) {
    d = defaultCountryCode + d;
  }
  if (d.length < 8 || d.length > 15) return null;
  return d;
}

/**
 * Construit un lien WhatsApp sécurisé et encodé.
 * Retourne null en cas d'erreur de numéro ou si le numéro est vide.
 */
export function buildWhatsAppLink(
  phone: string | null | undefined,
  message: string
): string | null {
  const normalized = normalizeWhatsAppNumber(phone);
  if (!normalized) return null;

  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encodedText}`;
}

/**
 * Construit un lien WhatsApp pour ENVOYER UNE FACTURE à un client : numéro mis au
 * format international + message clair (n° facture, total FCFA, boutique).
 * Retourne null si le numéro est manquant/invalide (l'appelant affiche alors un
 * message clair sans planter). wa.me ne peut pas joindre de fichier : le PDF est
 * téléchargé à part et joint manuellement dans la conversation.
 */
export function buildInvoiceWhatsAppLink(params: {
  phone: string | null | undefined;
  invoiceNumber: string;
  totalLabel: string;
  shopName: string;
  clientName?: string | null;
}): string | null {
  const intl = internationalizeNumber(params.phone);
  if (!intl) return null;
  const hi = params.clientName ? `Bonjour ${params.clientName} 👋` : "Bonjour 👋";
  const message =
    `${hi}\n` +
    `Voici votre facture *${params.invoiceNumber}* de *${params.shopName}*.\n` +
    `Montant total : *${params.totalLabel}*.\n` +
    `Merci pour votre confiance !`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

/**
 * Génère le lien WhatsApp pour contacter l'administrateur de GestionPro.
 * Utilise la variable d'environnement centralisée.
 */
export function getAdminWhatsAppLink(): string {
  const adminPhone = env.NEXT_PUBLIC_WHATSAPP_ADMIN_NUMBER || "221773831364";
  const message = "Bonjour GestionPro 👋\nJe souhaite obtenir des informations concernant votre plateforme de gestion commerciale.\nMerci de me recontacter.";
  const link = buildWhatsAppLink(adminPhone, message);
  // Fallback simple au cas où
  return link || `https://wa.me/221773831364?text=${encodeURIComponent(message)}`;
}

/**
 * Génère le lien WhatsApp pour contacter une boutique spécifique.
 */
export function getShopWhatsAppLink(
  phone: string | null | undefined,
  shopName: string | null | undefined
): string | null {
  if (!phone) return null;
  
  if (!shopName) {
    return getGeneralSellerWhatsAppLink(phone);
  }
  
  const message = `Bonjour 👋\nJe visite actuellement votre boutique *${shopName}* sur GestionPro et j'aimerais obtenir davantage d'informations concernant vos produits et vos services.\nMerci de votre retour.`;
  return buildWhatsAppLink(phone, message);
}

/**
 * Génère le lien WhatsApp pour un produit spécifique dans une boutique.
 */
export function getProductWhatsAppLink(
  phone: string | null | undefined,
  productName: string,
  shopName: string
): string | null {
  if (!phone) return null;
  
  const message = `Bonjour 👋\nJe suis intéressé par le produit *${productName}* proposé sur votre boutique *${shopName}* sur GestionPro.\nPouvez-vous me communiquer plus d'informations concernant sa disponibilité, son prix ou ses caractéristiques ?\nMerci.`;
  return buildWhatsAppLink(phone, message);
}

/**
 * Message générique pour contacter un vendeur sans boutique ni produit spécifique.
 */
export function getGeneralSellerWhatsAppLink(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const message = "Bonjour 👋\nJe souhaite obtenir davantage d'informations concernant votre activité et vos produits visibles sur GestionPro.\nMerci de votre retour.";
  return buildWhatsAppLink(phone, message);
}
