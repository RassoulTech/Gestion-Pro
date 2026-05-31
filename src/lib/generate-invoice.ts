import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BRAND_COLOR: [number, number, number] = [234, 88, 12]; // #ea580c (Orange brand)
const DARK_COLOR: [number, number, number] = [15, 23, 42]; // Slate-900
const MUTED_COLOR: [number, number, number] = [100, 116, 139]; // Slate-500
const BORDER_COLOR: [number, number, number] = [241, 245, 249]; // Slate-100

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
  status: string;
  boutique: InvoiceBoutique;
  client: InvoiceClient;
  lignes: InvoiceLigne[];
  total: number;
  remise: number;
}

function formatCurrencyCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "decimal" }).format(amount) + " FCFA";
}

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 20;

  // ─── Logo & Header ───
  if (data.boutique.logo) {
    try {
      // If logo is Base64 data URL, we can embed it
      if (data.boutique.logo.startsWith("data:image")) {
        doc.addImage(data.boutique.logo, "WEBP", margin, y, 20, 20);
      }
    } catch (e) {
      console.error("[invoice-pdf] Logo image loading failed:", e);
    }
  }

  // Shop Name & Info
  doc.setTextColor(DARK_COLOR[0], DARK_COLOR[1], DARK_COLOR[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(data.boutique.nom, data.boutique.logo ? margin + 24 : margin, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
  let boutiqueDetails = "";
  if (data.boutique.adresse) boutiqueDetails += `${data.boutique.adresse}  |  `;
  if (data.boutique.telephone) boutiqueDetails += `Tél: ${data.boutique.telephone}  |  `;
  if (data.boutique.email) boutiqueDetails += `Email: ${data.boutique.email}`;
  
  doc.text(
    boutiqueDetails.endsWith("  |  ") ? boutiqueDetails.slice(0, -5) : boutiqueDetails,
    data.boutique.logo ? margin + 24 : margin,
    y + 12
  );

  // Stripe-style top-right "FACTURE" indicator
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
  doc.text("FACTURE", pageWidth - margin, y + 6, { align: "right" });

  doc.setFont("helvetica", "normal");
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
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(DARK_COLOR[0], DARK_COLOR[1], DARK_COLOR[2]);
  doc.text("FACTURÉ À", margin, y);
  doc.text("DÉTAILS", pageWidth - margin - 50, y);

  y += 6;

  // Client Details
  doc.setFont("helvetica", "normal");
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
  doc.setFont("helvetica", "bold");
  doc.setTextColor(DARK_COLOR[0], DARK_COLOR[1], DARK_COLOR[2]);
  doc.text(data.date.toLocaleDateString("fr-FR"), metaX + 30, y);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
  doc.text("Statut :", metaX, y + 5);
  doc.setFont("helvetica", "bold");
  if (data.status === "VALIDEE" || data.status === "CONFIRME" || data.status === "LIVREE") {
    doc.setTextColor(16, 185, 129);
  } else {
    doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
  }
  doc.text(data.status, metaX + 30, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
  doc.text("Mode de paiement :", metaX, y + 10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(DARK_COLOR[0], DARK_COLOR[1], DARK_COLOR[2]);
  doc.text("Paiement Direct", metaX + 30, y + 10);

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
      fillColor: DARK_COLOR,
      textColor: [255, 255, 255],
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
      1: { halign: "center", cellWidth: 20 },
      2: { halign: "right", cellWidth: 35 },
      3: { halign: "right", cellWidth: 35 },
    },
    styles: {
      cellPadding: 5,
      lineWidth: 0,
    },
    tableLineWidth: 0,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 12;

  // ─── Summary (Totals) ───
  const summaryX = pageWidth - margin - 60;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
  doc.text("Sous-total :", summaryX, y);
  
  const sousTotalVal = data.lignes.reduce((sum, l) => sum + l.prixUnitaire * l.quantite, 0);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(DARK_COLOR[0], DARK_COLOR[1], DARK_COLOR[2]);
  doc.text(formatCurrencyCFA(sousTotalVal), pageWidth - margin, y, { align: "right" });

  if (data.remise > 0) {
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
    doc.text("Remise :", summaryX, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(239, 68, 68);
    doc.text(`- ${formatCurrencyCFA(data.remise)}`, pageWidth - margin, y, { align: "right" });
  }

  y += 8;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.5);
  doc.line(summaryX, y - 4, pageWidth - margin, y - 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(DARK_COLOR[0], DARK_COLOR[1], DARK_COLOR[2]);
  doc.text("Total à payer :", summaryX, y);
  doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
  doc.text(formatCurrencyCFA(data.total), pageWidth - margin, y, { align: "right" });

  // ─── Footer ───
  const footerY = pageHeight - 20;

  // Separator
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  // Left side: thank you note
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
  doc.text(
    "Merci pour votre confiance ! Pour toute question, contactez notre support.",
    margin,
    footerY + 3
  );

  // Right side: GestionPro badge
  const appBadgeX = pageWidth - margin - 35;
  
  // "G" logo box
  doc.setFillColor(234, 88, 12); // Brand orange
  doc.roundedRect(appBadgeX, footerY - 1.2, 5, 5, 1.2, 1.2, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(3.8);
  doc.text("G", appBadgeX + 2.5, footerY + 2.4, { align: "center" });

  // "GestionPro" text
  doc.setTextColor(DARK_COLOR[0], DARK_COLOR[1], DARK_COLOR[2]); // slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("Gestion", appBadgeX + 6.5, footerY + 2.5);
  
  doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]); // orange
  doc.text("Pro", appBadgeX + 16.5, footerY + 2.5);

  // Smaller copyright / security text below
  doc.setFont("helvetica", "normal");
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
