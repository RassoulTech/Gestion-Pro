"use client";

import { Printer, Download, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateInvoicePDF } from "@/lib/generate-invoice";
import { buildInvoiceWhatsAppLink } from "@/lib/whatsapp";
import { formatCurrency } from "@/lib/utils";

type FactureBoutique = {
  nom: string;
  logo: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
};

type FactureCommande = {
  code: string;
  /** Date ISO de la commande. */
  date: string;
  /** Numéro déjà généré (commandes marketplace) — sinon dérivé du code. */
  invoiceNumber: string | null;
  statutPaiement: string | null;
  remise: number;
  total: number;
  notes: string | null;
  client: {
    nom: string;
    prenom: string | null;
    telephone: string | null;
    email: string | null;
    adresse: string | null;
  } | null;
  lignes: { nom: string; quantite: number; prixUnitaire: number }[];
};

/**
 * Facture imprimable / téléchargeable générée depuis une commande
 * (même rendu PDF que le module Factures).
 */
export function FactureCommandeButtons({
  boutique,
  commande,
}: {
  boutique: FactureBoutique;
  commande: FactureCommande;
}) {
  const date = new Date(commande.date);
  // Numérotation stable, alignée sur le marketplace : FAC-YYYYMMDD-<code>.
  const dateSuffix = date.toISOString().slice(0, 10).replace(/-/g, "");
  const invoiceNumber =
    commande.invoiceNumber || `FAC-${dateSuffix}-${commande.code.replace(/^CMD-/, "")}`;
  const paid = commande.statutPaiement === "CONFIRME";
  const clientName = commande.client
    ? [commande.client.prenom, commande.client.nom].filter(Boolean).join(" ").trim() || null
    : null;

  function buildPdf() {
    return generateInvoicePDF({
      invoiceNumber,
      date,
      status: paid ? "PAYEE" : "IMPAYEE",
      statusLabel: paid ? "Payée" : "À payer",
      boutique,
      client: commande.client ?? {
        nom: "Client occasionnel",
        prenom: null,
        telephone: null,
        email: null,
        adresse: null,
      },
      lignes: commande.lignes,
      total: commande.total,
      remise: commande.remise,
      notes: commande.notes,
    });
  }

  function printPdf() {
    try {
      const doc = buildPdf();
      doc.autoPrint();
      doc.output("dataurlnewwindow");
    } catch {
      toast.error("Impression impossible.");
    }
  }

  function downloadPdf() {
    try {
      const doc = buildPdf();
      doc.save(`Facture-${commande.code}.pdf`);
    } catch {
      toast.error("Échec de la génération du PDF.");
    }
  }

  function sendWhatsApp() {
    const link = buildInvoiceWhatsAppLink({
      phone: commande.client?.telephone,
      invoiceNumber,
      totalLabel: formatCurrency(commande.total),
      shopName: boutique.nom,
      clientName,
    });
    if (!link) {
      toast.error("Numéro WhatsApp du client manquant ou invalide.");
      return;
    }
    // wa.me ne joint pas de fichier : on télécharge le PDF pour qu'il soit prêt à
    // être joint dans la conversation, puis on ouvre WhatsApp avec le bon numéro.
    try {
      buildPdf().save(`Facture-${commande.code}.pdf`);
    } catch {
      /* le téléchargement est un confort ; on continue vers WhatsApp */
    }
    window.open(link, "_blank", "noopener,noreferrer");
    toast.success("Facture téléchargée — joignez le PDF dans WhatsApp.");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        className="h-10 flex-1 rounded-xl bg-[#25D366] font-bold text-white hover:bg-[#1ebe57] sm:flex-none"
        onClick={sendWhatsApp}
      >
        <MessageCircle className="mr-2 h-4 w-4" /> Envoyer sur WhatsApp
      </Button>
      <Button variant="brand-outline" className="h-10 flex-1 rounded-xl font-bold sm:flex-none" onClick={printPdf}>
        <Printer className="mr-2 h-4 w-4" /> Imprimer
      </Button>
      <Button
        variant="outline"
        className="h-10 rounded-xl font-bold"
        onClick={downloadPdf}
        aria-label="Télécharger la facture en PDF"
      >
        <Download className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">PDF</span>
      </Button>
    </div>
  );
}
