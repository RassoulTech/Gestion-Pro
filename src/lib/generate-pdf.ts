import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BRAND_COLOR: [number, number, number] = [234, 88, 12]; // #ea580c
const DARK_COLOR: [number, number, number] = [24, 24, 27]; // zinc-900
const MUTED_COLOR: [number, number, number] = [113, 113, 122]; // zinc-500

interface ReportData {
  boutiqueName: string;
  stats: {
    ventesToday: number;
    totalProduits: number;
    totalClients: number;
    alertesStock: number;
  };
  ventesParJour: { date: string; ventes: number }[];
  topProduits: { nom: string; total: number }[];
}

function formatCurrencyCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "decimal" }).format(amount) + " FCFA";
}

export function generateRapportPDF(data: ReportData): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // ─── Header bar ───
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("GestionPro", margin, 18);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Rapport — ${data.boutiqueName}`, margin, 28);

  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(10);
  doc.text(dateStr, pageWidth - margin, 28, { align: "right" });

  y = 52;

  // ─── Summary cards ───
  doc.setTextColor(...DARK_COLOR);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resume", margin, y);
  y += 8;

  const cardWidth = (pageWidth - margin * 2 - 12) / 4;
  const cards = [
    { label: "Ventes du jour", value: formatCurrencyCFA(data.stats.ventesToday) },
    { label: "Produits", value: String(data.stats.totalProduits) },
    { label: "Clients", value: String(data.stats.totalClients) },
    { label: "Alertes stock", value: String(data.stats.alertesStock) },
  ];

  cards.forEach((card, i) => {
    const x = margin + i * (cardWidth + 4);
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(x, y, cardWidth, 22, 3, 3, "F");

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED_COLOR);
    doc.text(card.label.toUpperCase(), x + 4, y + 8);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_COLOR);
    doc.text(card.value, x + 4, y + 17);
  });

  y += 32;

  // ─── Ventes par jour table ───
  doc.setTextColor(...DARK_COLOR);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Ventes par jour (30 derniers jours)", margin, y);
  y += 4;

  const totalVentes = data.ventesParJour.reduce((sum, v) => sum + v.ventes, 0);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Date", "Ventes (FCFA)"]],
    body: [
      ...data.ventesParJour
        .filter((v) => v.ventes > 0)
        .map((v) => [v.date, formatCurrencyCFA(v.ventes)]),
      ["TOTAL", formatCurrencyCFA(totalVentes)],
    ],
    headStyles: {
      fillColor: BRAND_COLOR,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: DARK_COLOR,
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252],
    },
    // Style the total row (last row)
    didParseCell(hookData) {
      const isLastRow = hookData.row.index === hookData.table.body.length - 1;
      if (hookData.section === "body" && isLastRow) {
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.fillColor = [255, 240, 230];
        hookData.cell.styles.textColor = BRAND_COLOR;
      }
    },
    styles: {
      cellPadding: 4,
      lineWidth: 0,
    },
    tableLineWidth: 0,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 12;

  // ─── Top produits table ───
  if (data.topProduits.length > 0) {
    // Check if we need a new page
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setTextColor(...DARK_COLOR);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Top Produits", margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["#", "Produit", "Quantite vendue"]],
      body: data.topProduits.map((p, i) => [String(i + 1), p.nom, String(p.total)]),
      headStyles: {
        fillColor: BRAND_COLOR,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: DARK_COLOR,
      },
      alternateRowStyles: {
        fillColor: [252, 252, 252],
      },
      columnStyles: {
        0: { cellWidth: 15, halign: "center" },
        2: { halign: "right" },
      },
      styles: {
        cellPadding: 4,
        lineWidth: 0,
      },
      tableLineWidth: 0,
    });
  }

  // ─── Footer ───
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED_COLOR);
    doc.text(
      `GestionPro — ${data.boutiqueName} — Page ${i}/${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  return doc;
}
