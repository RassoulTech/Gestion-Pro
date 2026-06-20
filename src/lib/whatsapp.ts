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
