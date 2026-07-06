"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadSubscriptionInvoice } from "@/server/actions/subscription.actions";
import { base64ToPdfBlob, downloadPdfBlob } from "@/lib/pdf-delivery";

/**
 * Télécharge la facture PDF d'un paiement d'abonnement confirmé.
 * PDF régénéré côté serveur ; téléchargement fiable desktop/Android/iOS.
 */
export function SubscriptionInvoiceButton({ paiementId }: { paiementId: string }) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    setBusy(true);
    try {
      const res = await downloadSubscriptionInvoice({ paiementId });
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      const data = res?.data;
      if (!data?.base64) {
        toast.error("Facture indisponible. Veuillez réessayer.");
        return;
      }
      const outcome = downloadPdfBlob(base64ToPdfBlob(data.base64), `${data.invoiceNumber}.pdf`);
      toast.success(
        outcome === "downloaded"
          ? `Facture ${data.invoiceNumber} téléchargée.`
          : "Facture ouverte — utilisez Partager → Enregistrer dans Fichiers."
      );
    } catch {
      toast.error("Le téléchargement a échoué. Veuillez réessayer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={busy}
      className="h-8 rounded-lg px-2.5 text-[11px] font-black"
      aria-label="Télécharger la facture PDF"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
      <span className="ml-1.5">Facture</span>
    </Button>
  );
}
