"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getBoutiqueStats, getVentesParJour, getTopProduits } from "@/server/queries/dashboard.queries";
import { generateRapportPDF } from "@/lib/generate-pdf";

interface PDFDownloadButtonProps {
  boutiqueId: string;
  boutiqueName: string;
  startDate?: string; // ISO string
  endDate?: string; // ISO string
}

export function PDFDownloadButton({ boutiqueId, boutiqueName, startDate, endDate }: PDFDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;

      const [stats, ventesParJour, topProduits] = await Promise.all([
        getBoutiqueStats(boutiqueId, start, end),
        getVentesParJour(boutiqueId, 30, start, end),
        getTopProduits(boutiqueId, 10, start, end),
      ]);

      const doc = generateRapportPDF({
        boutiqueName,
        stats: {
          ventesToday: stats.ventesPeriod,
          totalProduits: stats.totalProduits,
          totalClients: stats.totalClients,
          alertesStock: stats.alertesStock,
        },
        ventesParJour,
        topProduits,
      });

      // Mobile-friendly download: use blob URL + link click
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rapport-${boutiqueName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Rapport PDF telecharge !");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Erreur lors de la generation du PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={loading}
      variant="outline"
      className="rounded-xl h-10 px-4 font-bold gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generation...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          Telecharger PDF
        </>
      )}
    </Button>
  );
}
