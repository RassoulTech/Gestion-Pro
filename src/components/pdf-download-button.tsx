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
  period?: number;
}

export function PDFDownloadButton({ boutiqueId, boutiqueName, period = 30 }: PDFDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const [stats, ventesParJour, topProduits] = await Promise.all([
        getBoutiqueStats(boutiqueId),
        getVentesParJour(boutiqueId, period),
        getTopProduits(boutiqueId, 10),
      ]);

      const doc = generateRapportPDF({
        boutiqueName,
        stats,
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
