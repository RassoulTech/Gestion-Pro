import jsPDF from "jspdf";
import QRCode from "qrcode";

const BRAND_ORANGE: [number, number, number] = [234, 88, 12]; // #ea580c (Orange)
const BRAND_DARK: [number, number, number] = [15, 23, 42]; // Slate-900
const BRAND_LIGHT: [number, number, number] = [248, 250, 252]; // Slate-50

interface QRCodePDFData {
  boutiqueName: string;
  boutiqueSlug: string;
  boutiqueLogo: string | null;
  boutiqueDescription: string | null;
  themeColor?: string; // custom hex color for Enterprise users
}

export async function generateBoutiqueQRCodeDataURL(slug: string): Promise<string> {
  const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const storeUrl = `${domain}/s/${slug}`;
  
  // Return high-quality PNG QR Code data URL
  return QRCode.toDataURL(storeUrl, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 600,
    color: {
      dark: "#0f172a", // slate-900
      light: "#ffffff",
    },
  });
}

export async function generateBoutiqueQRCodePDF(data: QRCodePDFData): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Determine colors based on customization options
  let primaryColor = BRAND_ORANGE;
  if (data.themeColor) {
    try {
      const cleanHex = data.themeColor.replace("#", "");
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        primaryColor = [r, g, b];
      }
    } catch {
      // fallback
    }
  }

  // ─── Background & Border ───
  // Outer decorative container
  doc.setFillColor(...BRAND_LIGHT);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Inner cards (White bento card)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, 8, 8, "F");

  // Border frame
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(1.5);
  doc.roundedRect(margin + 2, margin + 2, pageWidth - margin * 2 - 4, pageHeight - margin * 2 - 4, 6, 6, "D");

  let y = margin + 18;

  // ─── Logo / Brand Header ───
  if (data.boutiqueLogo) {
    try {
      if (data.boutiqueLogo.startsWith("data:image")) {
        doc.addImage(data.boutiqueLogo, "WEBP", pageWidth / 2 - 15, y, 30, 30);
        y += 34;
      }
    } catch (e) {
      console.error("[qrcode-pdf] Logo image loading failed:", e);
      y += 5;
    }
  } else {
    // Elegant fallback icon
    doc.setFillColor(...primaryColor);
    doc.roundedRect(pageWidth / 2 - 12, y, 24, 24, 6, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("GP", pageWidth / 2, y + 15, { align: "center" });
    y += 30;
  }

  // ─── Shop Name & Slogan ───
  doc.setTextColor(...BRAND_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text(data.boutiqueName, pageWidth / 2, y, { align: "center" });

  y += 8;

  if (data.boutiqueDescription) {
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    // Split long description into lines
    const splitDesc = doc.splitTextToSize(data.boutiqueDescription, pageWidth - margin * 2 - 30);
    doc.text(splitDesc, pageWidth / 2, y, { align: "center" });
    y += splitDesc.length * 6 + 4;
  } else {
    y += 4;
  }

  // ─── QR Code Center Card ───
  // A beautiful rounded box holding the QR Code, similar to Orange Money/Wave merchant sheets
  const qrBoxSize = 90;
  const qrX = pageWidth / 2 - qrBoxSize / 2;
  
  // Background card for QR code
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(qrX - 6, y - 6, qrBoxSize + 12, qrBoxSize + 12, 6, 6, "FD");

  try {
    const qrCodeDataURL = await generateBoutiqueQRCodeDataURL(data.boutiqueSlug);
    doc.addImage(qrCodeDataURL, "PNG", qrX, y, qrBoxSize, qrBoxSize);
  } catch (err) {
    console.error("[qrcode-pdf] QR Code generation failed:", err);
  }

  y += qrBoxSize + 22;

  // ─── Scan Instructions ───
  doc.setTextColor(...BRAND_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Scannez ce code pour accéder directement à notre boutique.", pageWidth / 2, y, { align: "center" });

  y += 8;

  // Store Link Display
  const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const linkText = `${domain.replace("https://", "").replace("http://", "")}/s/${data.boutiqueSlug}`;
  
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(linkText, pageWidth / 2, y, { align: "center" });

  // ─── Branding Footer ───
  doc.setFillColor(...primaryColor);
  doc.rect(margin + 5, pageHeight - margin - 15, pageWidth - margin * 2 - 10, 10, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("SUPPORT DE PAIEMENT & COMMANDE DIRECTE — SECURISE PAR GESTIONPRO", pageWidth / 2, pageHeight - margin - 8.5, { align: "center" });

  return doc;
}
