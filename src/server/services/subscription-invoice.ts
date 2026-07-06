import "server-only";

import { prisma } from "@/lib/prisma";
import { generateInvoicePDF } from "@/lib/generate-invoice";
import { GESTIONPRO_LOGO_BASE64 } from "@/lib/brand-logo-base64";
import { paymentMethodLabel } from "@/lib/payment-method";
import { sendSubscriptionInvoiceEmail } from "@/lib/mail";
import { logActivity } from "@/lib/activity-log";

/**
 * Facture d'ABONNEMENT (forfait) — émise par la plateforme GestionPro au
 * vendeur, pour chaque paiement CONFIRMÉ.
 *
 * Numérotation `FAC-GP-<année>-<seq>` : la séquence est DÉTERMINISTE — rang du
 * paiement parmi les paiements confirmés de la même année, ordonnés par
 * (createdAt, id). Même numéro à chaque régénération (aucun état à stocker,
 * aucune course sur rejeu d'IPN), unique par construction.
 */

const PLATFORM = {
  nom: "GestionPro",
  logo: GESTIONPRO_LOGO_BASE64,
  telephone: "+221 77 383 13 64",
  email: "no-reply@mongestionpro.com",
  adresse: "Dakar, Sénégal",
};

type PaiementFacturable = NonNullable<Awaited<ReturnType<typeof loadPaiement>>>;

function loadPaiement(paiementId: string) {
  return prisma.paiement.findUnique({
    where: { id: paiementId },
    include: {
      abonnement: { include: { plan: true, vendeur: true } },
    },
  });
}

async function computeInvoiceNumber(p: PaiementFacturable): Promise<string> {
  const year = p.createdAt.getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  // Rang déterministe parmi les paiements confirmés de l'année (ordre createdAt, puis id).
  const rank = await prisma.paiement.count({
    where: {
      statut: "CONFIRME",
      createdAt: { gte: start, lt: end },
      OR: [
        { createdAt: { lt: p.createdAt } },
        { createdAt: p.createdAt, id: { lte: p.id } },
      ],
    },
  });
  return `FAC-GP-${year}-${String(Math.max(rank, 1)).padStart(4, "0")}`;
}

/** Construit le PDF de la facture d'abonnement (montants lus en base). */
async function buildPdf(p: PaiementFacturable, invoiceNumber: string) {
  const vendeur = p.abonnement.vendeur;
  const plan = p.abonnement.plan;
  return generateInvoicePDF({
    invoiceNumber,
    date: p.createdAt,
    status: "PAYEE",
    statusLabel: "Payée",
    boutique: PLATFORM,
    client: {
      nom: vendeur.nom,
      prenom: vendeur.prenom,
      telephone: vendeur.telephone,
      email: vendeur.email,
      adresse: vendeur.adresse,
    },
    lignes: [
      {
        nom: `Forfait ${plan.nom} — abonnement GestionPro (30 jours)`,
        quantite: 1,
        prixUnitaire: p.montant,
      },
    ],
    total: p.montant,
    remise: 0,
    modePaiement: paymentMethodLabel(p.methode),
    // Facture de la plateforme → identité GestionPro (pas de réglages boutique).
  });
}

/**
 * Génère la facture d'un paiement d'abonnement CONFIRMÉ, la référence dans
 * `paiement.metadata` (consultable/retéléchargeable) et l'envoie par e-mail au
 * vendeur avec le PDF en pièce jointe. Idempotent : rejouable sans doublon
 * (même numéro ; l'e-mail n'est renvoyé que si `resend` est vrai ou premier envoi).
 */
export async function generateAndSendSubscriptionInvoice(
  paiementId: string,
  opts: { resend?: boolean } = {}
): Promise<{ invoiceNumber: string; emailed: boolean }> {
  const p = await loadPaiement(paiementId);
  if (!p) throw new Error("Paiement introuvable.");
  if (p.statut !== "CONFIRME") throw new Error("Paiement non confirmé — facture non émise.");

  const meta = (p.metadata ?? {}) as Record<string, unknown>;
  const alreadyEmailed = Boolean(meta.invoiceEmailedAt);
  const invoiceNumber =
    typeof meta.invoiceNumber === "string" && meta.invoiceNumber
      ? meta.invoiceNumber
      : await computeInvoiceNumber(p);

  let emailed = false;
  const vendeurEmail = p.abonnement.vendeur.email?.trim();
  if (vendeurEmail && (!alreadyEmailed || opts.resend)) {
    const doc = await buildPdf(p, invoiceNumber);
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    const result = await sendSubscriptionInvoiceEmail(
      vendeurEmail,
      `${p.abonnement.vendeur.prenom} ${p.abonnement.vendeur.nom}`.trim(),
      p.abonnement.plan.nom,
      p.montant,
      invoiceNumber,
      pdfBuffer
    );
    emailed = result.sent;
  }

  await prisma.paiement.update({
    where: { id: p.id },
    data: {
      metadata: {
        ...meta,
        invoiceNumber,
        invoicedAt: (meta.invoicedAt as string) ?? new Date().toISOString(),
        ...(emailed ? { invoiceEmailedAt: new Date().toISOString() } : {}),
      },
    },
  });

  await logActivity({
    action: "SUBSCRIPTION_INVOICE_GENERATED",
    subjectType: "Paiement",
    subjectId: p.id,
    changes: { invoiceNumber, emailed, montant: p.montant },
  });

  return { invoiceNumber, emailed };
}

/**
 * PDF (base64) d'une facture d'abonnement pour RETÉLÉCHARGEMENT — régénéré à la
 * demande depuis la base (aucun blob stocké). L'appelant vérifie l'autorisation.
 */
export async function getSubscriptionInvoicePdf(
  paiementId: string
): Promise<{ invoiceNumber: string; base64: string }> {
  const p = await loadPaiement(paiementId);
  if (!p) throw new Error("Paiement introuvable.");
  if (p.statut !== "CONFIRME") throw new Error("Paiement non confirmé.");

  const meta = (p.metadata ?? {}) as Record<string, unknown>;
  const invoiceNumber =
    typeof meta.invoiceNumber === "string" && meta.invoiceNumber
      ? meta.invoiceNumber
      : await computeInvoiceNumber(p);

  const doc = await buildPdf(p, invoiceNumber);
  const base64 = Buffer.from(doc.output("arraybuffer")).toString("base64");
  return { invoiceNumber, base64 };
}
