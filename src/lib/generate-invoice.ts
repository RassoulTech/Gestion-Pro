import type jsPDF from "jspdf";
import { GESTIONPRO_LOGO_BASE64 } from "./brand-logo-base64";
import {
  parseFactureSettings,
  type FactureSettings,
} from "@/schemas/facture-settings.schema";

// ⚡ Perf : `jspdf` + `jspdf-autotable` (~150 Ko) ne sont PAS chargés au rendu des
// pages factures/commandes. Ils sont importés dynamiquement à l'appel (impression
// ou téléchargement), ce qui allège fortement le bundle initial de ces pages.

const BRAND_COLOR: [number, number, number] = [234, 88, 12]; // #ea580c (Orange brand)
const DARK_COLOR: [number, number, number] = [15, 23, 42]; // Slate-900
const MUTED_COLOR: [number, number, number] = [100, 116, 139]; // Slate-500
const BORDER_COLOR: [number, number, number] = [241, 245, 249]; // Slate-100

/** #RRGGBB → [r,g,b] ; retombe sur l'orange de marque si invalide. */
function hexToRgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m?.[1]) return BRAND_COLOR;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

interface InvoiceBoutique {
  nom: string;
  logo: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
}

interface InvoiceClient {
  nom: string;
  prenom: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
}

interface InvoiceLigne {
  nom: string;
  quantite: number;
  prixUnitaire: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  /** Code de statut (sert au choix de la couleur) — ex. "PAYEE". */
  status: string;
  /** Libellé lisible affiché (ex. "Payée"). À défaut, `status` est utilisé. */
  statusLabel?: string;
  boutique: InvoiceBoutique;
  client: InvoiceClient;
  lignes: InvoiceLigne[];
  total: number;
  remise: number;
  /** Montant de TVA (FCFA). Optionnel — affiché seulement si > 0. */
  montantTva?: number;
  /** Taux de TVA appliqué (%) — pour le libellé "TVA (18 %)". */
  tauxTva?: number;
  /** Notes libres affichées sous le tableau (optionnel). */
  notes?: string | null;
  /** Moyen de paiement RÉEL (libellé FR, ex. "Wave") — "—" si inconnu. */
  modePaiement?: string | null;
  /**
   * Personnalisation de la boutique (Boutique.factureSettings, jsonb brut ou
   * déjà résolu). Absent = défauts de la marque.
   */
  settings?: FactureSettings | unknown;
}

/**
 * Montants des DOCUMENTS (PDF) — formateur DÉTERMINISTE, sans locale.
 * Cause racine du « 200/000 » : Intl fr-FR émet U+202F (espace fine insécable)
 * comme séparateur ; les polices standard jsPDF encodent en WinAnsi (1 octet)
 * et tronquent le code point → 0x202F & 0xFF = 0x2F = « / ». On groupe donc
 * nous-mêmes avec U+00A0 (insécable, PRÉSENT dans WinAnsi) → rendu garanti
 * identique quel que soit l'ICU du serveur.
 */
export function formatMontantFCFA(amount: number): string {
  const entier = Math.round(amount).toString();
  const groupe = entier.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${groupe} FCFA`;
}
const formatCurrencyCFA = formatMontantFCFA;

/** Libellés FR des statuts — jamais de clé technique sur un document. */
const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  VALIDEE: "Validée",
  LIVREE: "Livrée",
  ANNULEE: "Annulée",
  CONFIRME: "Confirmée",
  PAYEE: "Payée",
  IMPAYEE: "Impayée",
  BROUILLON: "Brouillon",
  REMBOURSE: "Remboursée",
};

/** Texte lisible sur la couleur d'accent (luminance relative → blanc ou encre). */
function contrastOn(rgb: [number, number, number]): [number, number, number] {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const L = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  return L > 0.45 ? [15, 23, 42] : [255, 255, 255];
}

export async function generateInvoicePDF(data: InvoiceData): Promise<jsPDF> {
  const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  // Personnalisation boutique (défauts de marque si absente/invalide).
  const settings = parseFactureSettings(data.settings);
  const ACCENT = hexToRgb(settings.accentColor);
  const PDF_FONT = settings.font; // helvetica | times | courier (polices standard PDF, rendu identique partout sans embarquement)
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 20;

  // ─── Logo & Header ───
  if (data.boutique.logo) {
    try {
      // If logo is Base64 data URL, we can embed it — format détecté depuis le
      // mime (le "WEBP" codé en dur cassait les logos PNG/JPEG).
      if (data.boutique.logo.startsWith("data:image")) {
        const mime = /^data:image\/(\w+)/.exec(data.boutique.logo)?.[1]?.toLowerCase();
        const format = mime === "png" ? "PNG" : mime === "webp" ? "WEBP" : "JPEG";
        doc.addImage(data.boutique.logo, format, margin, y, 20, 20);
      }
    } catch (e) {
      console.error("[invoice-pdf] Logo image loading failed:", e);
    }
  }

  // Shop Name & Info
  doc.setTextColor(DARK_COLOR[0], DARK_COLOR[1], DARK_COLOR[2]);
  doc.setFont(PDF_FONT, "bold");
  doc.setFontSize(20);
  doc.text(data.boutique.nom, data.boutique.logo ? margin + 24 : margin, y + 6);

  doc.setFont(PDF_FONT, "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
  let boutiqueDetails = "";
  if (settings.showAdresse && data.boutique.adresse) boutiqueDetails += `${data.boutique.adresse}  |  `;
  if (settings.showTelephone && data.boutique.telephone) boutiqueDetails += `Tél: ${data.boutique.telephone}  |  `;
  if (settings.showEmail && data.boutique.email) boutiqueDetails += `Email: ${data.boutique.email}`;
  
  doc.text(
    boutiqueDetails.endsWith("  |  ") ? boutiqueDetails.slice(0, -5) : boutiqueDetails,
    data.boutique.logo ? margin + 24 : margin,
    y + 12
  );

  // Top-right "FACTURE" indicator
  doc.setFont(PDF_FONT, "bold");
  doc.setFontSize(16);
  doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.text("FACTURE", pageWidth - margin, y + 6, { align: "right" });

  doc.setFont(PDF_FONT, "normal");
  doc.setFontSize(10);
  doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
  doc.text(`# ${data.invoiceNumber}`, pageWidth - margin, y + 12, { align: "right" });

  y += 28;

  // ─── Divider line ───
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 12;

  // ─── Client Info (Left) vs Invoice Metadata (Right) ───
  doc.setFont(PDF_FONT, "bold");
  doc.setFontSize(10);
  doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.text("FACTURÉ À", margin, y);
  doc.text("DÉTAILS", pageWidth - margin - 50, y);

  y += 6;

  // Client Details
  doc.setFont(PDF_FONT, "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
  
  const clientName = `${data.client.prenom || ""} ${data.client.nom}`.trim();
  doc.text(clientName, margin, y);
  
  let clientY = y + 5;
  if (data.client.adresse) {
    doc.text(data.client.adresse, margin, clientY);
    clientY += 5;
  }
  if (data.client.telephone) {
    doc.text(`Tél: ${data.client.telephone}`, margin, clientY);
    clientY += 5;
  }
  if (data.client.email) {
    doc.text(`Email: ${data.client.email}`, margin, clientY);
  }

  // Invoice Details Table-like layout on the right
  const metaX = pageWidth - margin - 50;
  doc.text("Date de facture :", metaX, y);
  doc.setFont(PDF_FONT, "bold");
  doc.setTextColor(DARK_COLOR[0], DARK_COLOR[1], DARK_COLOR[2]);
  doc.text(data.date.toLocaleDateString("fr-FR"), metaX + 30, y);
  
  doc.setFont(PDF_FONT, "normal");
  doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
  doc.text("Statut :", metaX, y + 5);
  doc.setFont(PDF_FONT, "bold");
  if (
    data.status === "VALIDEE" ||
    data.status === "CONFIRME" ||
    data.status === "LIVREE" ||
    data.status === "PAYEE"
  ) {
    doc.setTextColor(16, 185, 129);
  } else if (data.status === "ANNULEE") {
    doc.setTextColor(239, 68, 68);
  } else {
    doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  }
  doc.text(data.statusLabel ?? STATUS_LABELS[data.status] ?? data.status, metaX + 30, y + 5);

  doc.setFont(PDF_FONT, "normal");
  doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
  doc.text("Mode de paiement :", metaX, y + 10);
  doc.setFont(PDF_FONT, "bold");
  doc.setTextColor(DARK_COLOR[0], DARK_COLOR[1], DARK_COLOR[2]);
  doc.text(data.modePaiement || "—", metaX + 30, y + 10);

  y = Math.max(clientY + 12, y + 20);

  // ─── Products Table ───
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Description", "Quantité", "Prix unitaire", "Montant"]],
    body: data.lignes.map((item) => [
      item.nom,
      String(item.quantite),
      formatCurrencyCFA(item.prixUnitaire),
      formatCurrencyCFA(item.prixUnitaire * item.quantite),
    ]),
    headStyles: {
      fillColor: ACCENT,
      textColor: contrastOn(ACCENT),
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: DARK_COLOR,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "center", cellWidth: 16 },
      2: { halign: "right", cellWidth: 40 },
      3: { halign: "right", cellWidth: 40 },
    },
    styles: {
      cellPadding: 5,
      lineWidth: 0,
      font: PDF_FONT,
    },
    tableLineWidth: 0,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableFinalY = (doc as any).lastAutoTable.finalY + 12;
  y = tableFinalY;

  // ─── Notes (left, optional) ───
  if (data.notes && data.notes.trim()) {
    doc.setFont(PDF_FONT, "bold");
    doc.setFontSize(8);
    doc.setTextColor(DARK_COLOR[0], DARK_COLOR[1], DARK_COLOR[2]);
    doc.text("NOTES", margin, tableFinalY);
    doc.setFont(PDF_FONT, "normal");
    doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
    const noteLines = doc.splitTextToSize(data.notes.trim(), pageWidth - margin - 75);
    doc.text(noteLines, margin, tableFinalY + 5);
  }

  // ─── Summary (Totals) ───
  const summaryX = pageWidth - margin - 60;
  
  doc.setFont(PDF_FONT, "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
  doc.text("Sous-total :", summaryX, y);
  
  const sousTotalVal = data.lignes.reduce((sum, l) => sum + l.prixUnitaire * l.quantite, 0);
  doc.setFont(PDF_FONT, "bold");
  doc.setTextColor(DARK_COLOR[0], DARK_COLOR[1], DARK_COLOR[2]);
  doc.text(formatCurrencyCFA(sousTotalVal), pageWidth - margin, y, { align: "right" });

  if (data.remise > 0) {
    y += 6;
    doc.setFont(PDF_FONT, "normal");
    doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
    doc.text("Remise :", summaryX, y);
    doc.setFont(PDF_FONT, "bold");
    doc.setTextColor(239, 68, 68);
    doc.text(`- ${formatCurrencyCFA(data.remise)}`, pageWidth - margin, y, { align: "right" });
  }

  if (data.montantTva && data.montantTva > 0) {
    y += 6;
    doc.setFont(PDF_FONT, "normal");
    doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
    doc.text(`TVA${data.tauxTva ? ` (${data.tauxTva} %)` : ""} :`, summaryX, y);
    doc.setFont(PDF_FONT, "bold");
    doc.setTextColor(DARK_COLOR[0], DARK_COLOR[1], DARK_COLOR[2]);
    doc.text(formatCurrencyCFA(data.montantTva), pageWidth - margin, y, { align: "right" });
  }

  y += 8;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.5);
  doc.line(summaryX, y - 4, pageWidth - margin, y - 4);

  doc.setFont(PDF_FONT, "bold");
  doc.setFontSize(11);
  doc.setTextColor(DARK_COLOR[0], DARK_COLOR[1], DARK_COLOR[2]);
  doc.text("Total à payer :", summaryX, y);
  doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.text(formatCurrencyCFA(data.total), pageWidth - margin, y, { align: "right" });

  // ─── Footer ───
  const footerY = pageHeight - 20;

  // Mentions personnalisées (légales / conditions) — au-dessus du séparateur.
  if (settings.mentions) {
    doc.setFontSize(7);
    doc.setFont(PDF_FONT, "normal");
    doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
    const mentionLines = doc.splitTextToSize(settings.mentions, pageWidth - margin * 2);
    doc.text(mentionLines, margin, footerY - 7 - (mentionLines.length - 1) * 3.2);
  }

  // Separator
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  // Left side: thank you note (personnalisable)
  doc.setFontSize(8);
  doc.setFont(PDF_FONT, "normal");
  doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
  doc.text(
    doc.splitTextToSize(settings.merci, pageWidth - margin * 2 - 45),
    margin,
    footerY + 3
  );

  // Right side: GestionPro badge
  const appBadgeX = pageWidth - margin - 35;
  
  // Draw the exact "G" logo from the app using the PNG base64
  doc.addImage(GESTIONPRO_LOGO_BASE64, "PNG", appBadgeX, footerY - 1.2, 5, 5);

  // "GestionPro" text
  doc.setTextColor(DARK_COLOR[0], DARK_COLOR[1], DARK_COLOR[2]); // zinc-900
  doc.setFont(PDF_FONT, "bold");
  doc.setFontSize(7.5);
  doc.text("Gestion", appBadgeX + 6.5, footerY + 2.5);
  
  doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]); // orange
  doc.text("Pro", appBadgeX + 16.5, footerY + 2.5);

  // Smaller copyright / security text below
  doc.setFont(PDF_FONT, "normal");
  doc.setFontSize(7);
  doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
  doc.text(
    "Document électronique sécurisé et certifié",
    pageWidth - margin,
    footerY + 7.5,
    { align: "right" }
  );

  return doc;
}
