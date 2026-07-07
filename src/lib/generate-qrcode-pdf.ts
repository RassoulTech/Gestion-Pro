import jsPDF from "jspdf";
import QRCode from "qrcode";
import { GESTIONPRO_LOGO_BASE64 } from "./brand-logo-base64";

const BRAND_ORANGE: [number, number, number] = [234, 88, 12]; // #ea580c (Orange premium)
const BRAND_DARK: [number, number, number] = [15, 23, 42]; // Slate-900 (Noir doux)
const BRAND_GRAY: [number, number, number] = [100, 116, 139]; // Slate-500 (Gris élégant)
const BRAND_LIGHT_GRAY: [number, number, number] = [241, 245, 249]; // Slate-100

interface QRCodePDFData {
  boutiqueName: string;
  boutiqueSlug: string;
  boutiqueLogo: string | null;
  boutiqueDescription: string | null;
  themeColor?: string; // custom hex color for Enterprise users
  customSlogan?: string; // Slogan personnalisé (Enterprise)
  customMessage?: string; // Message personnalisé (Enterprise)
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
      dark: "#0f172a", // zinc-900
      light: "#ffffff",
    },
  });
}

export async function generateBoutiqueQRCodePDF(data: QRCodePDFData): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Determine accent color (default premium orange, unless customized by Enterprise)
  let accentColor = BRAND_ORANGE;
  if (data.themeColor) {
    try {
      const cleanHex = data.themeColor.replace("#", "");
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        accentColor = [r, g, b];
      }
    } catch {
      // fallback to default brand orange
    }
  }

  // ─── Background ───
  // Pure white dominant background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Elegant subtle light gray border around the sheet (poster style)
  doc.setDrawColor(...BRAND_LIGHT_GRAY);
  doc.setLineWidth(1);
  doc.roundedRect(margin - 5, margin - 5, pageWidth - (margin - 5) * 2, pageHeight - (margin - 5) * 2, 6, 6, "D");

  let y = margin + 10;

  // ─── 1. Logo of the Application (GestionPro) ───
  try {
    doc.addImage(GESTIONPRO_LOGO_BASE64, "PNG", pageWidth / 2 - 9, y, 18, 18);
    y += 20;
    
    // Sub-label for app logo
    doc.setTextColor(...BRAND_GRAY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("GESTIONPRO", pageWidth / 2, y, { align: "center", charSpace: 1.5 });
    y += 12;
  } catch (e) {
    console.error("[qrcode-pdf] App logo rendering failed:", e);
    y += 20;
  }

  // ─── 2. Logo of the Boutique ───
  if (data.boutiqueLogo) {
    try {
      if (data.boutiqueLogo.startsWith("data:image")) {
        // Render merchant logo nicely inside a rounded frame
        doc.setDrawColor(...BRAND_LIGHT_GRAY);
        doc.setLineWidth(0.5);
        doc.roundedRect(pageWidth / 2 - 13, y - 1, 26, 26, 4, 4, "D");
        
        doc.addImage(data.boutiqueLogo, "WEBP", pageWidth / 2 - 12, y, 24, 24);
        y += 32;
      }
    } catch (e) {
      console.error("[qrcode-pdf] Shop logo rendering failed:", e);
      y += 10;
    }
  } else {
    // Premium fallback placeholder
    doc.setFillColor(...accentColor);
    doc.roundedRect(pageWidth / 2 - 11, y, 22, 22, 5, 5, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(
      data.boutiqueName.substring(0, 2).toUpperCase(),
      pageWidth / 2,
      y + 13,
      { align: "center" }
    );
    y += 30;
  }

  // ─── 3. Nom de la Boutique ───
  doc.setTextColor(...BRAND_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(data.boutiqueName, pageWidth / 2, y, { align: "center" });

  y += 12;

  // ─── 4. QR Code Centré et Visible ───
  const qrBoxSize = 78;
  const qrX = pageWidth / 2 - qrBoxSize / 2;

  // Very elegant light-gray box outline to hold the QR code professionally
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...BRAND_LIGHT_GRAY);
  doc.setLineWidth(0.8);
  doc.roundedRect(qrX - 5, y - 5, qrBoxSize + 10, qrBoxSize + 10, 5, 5, "FD");

  try {
    const qrCodeDataURL = await generateBoutiqueQRCodeDataURL(data.boutiqueSlug);
    doc.addImage(qrCodeDataURL, "PNG", qrX, y, qrBoxSize, qrBoxSize);
  } catch (err) {
    console.error("[qrcode-pdf] QR Code generation failed:", err);
  }

  y += qrBoxSize + 18;

  // ─── 5. Sous le QR Code : "Scannez pour visiter notre boutique" ───
  const defaultSlogan = "Scannez pour visiter notre boutique";
  const sloganText = data.customSlogan || defaultSlogan;

  doc.setTextColor(...BRAND_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(sloganText, pageWidth / 2, y, { align: "center" });

  y += 8;

  // ─── 6. URL de la Boutique ───
  const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const cleanDomain = domain.replace("https://", "").replace("http://", "");
  const storeUrlText = `${cleanDomain}/s/${data.boutiqueSlug}`;

  doc.setTextColor(...accentColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(storeUrlText, pageWidth / 2, y, { align: "center" });

  y += 10;

  // ─── 7. Petite phrase marketing ───
  const defaultMessage = "Découvrez nos produits et commandez en ligne en quelques secondes.";
  const messageText = data.customMessage || defaultMessage;

  doc.setTextColor(...BRAND_GRAY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  // Split message to wrap cleanly
  const splitMsg = doc.splitTextToSize(messageText, pageWidth - margin * 2 - 20);
  doc.text(splitMsg, pageWidth / 2, y, { align: "center" });

  // ─── Elegant Footer line ───
  const footerY = pageHeight - margin - 5;
  doc.setDrawColor(...BRAND_LIGHT_GRAY);
  doc.setLineWidth(0.5);
  doc.line(margin + 5, footerY - 4, pageWidth - margin - 5, footerY - 4);

  doc.setTextColor(...BRAND_GRAY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    "AFFICHE D'ACCES DIRECT — GESTIONPRO — SYSTEME COMMERCIAL SECURISE",
    pageWidth / 2,
    footerY + 1,
    { align: "center", charSpace: 0.5 }
  );

  return doc;
}
