"use client";

import { useState } from "react";
import Link from "next/link";
import { Printer, Download, MessageCircle, Mail, Loader2, FileLock2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateInvoicePDF } from "@/lib/generate-invoice";
import { buildInvoiceWhatsAppLink } from "@/lib/whatsapp";
import { paymentMethodLabel } from "@/lib/payment-method";
import { formatCurrency } from "@/lib/utils";
import {
  canSharePdf,
  downloadPdfBlob,
  printPdfBlob,
  sharePdfBlob,
} from "@/lib/pdf-delivery";
import { sendCommandeInvoiceByEmail } from "@/server/actions/commande.actions";

type FactureBoutique = {
  nom: string;
  logo: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  /** Personnalisation de la facture (Boutique.factureSettings, jsonb brut). */
  factureSettings?: unknown;
};

type FactureCommande = {
  code: string;
  /** Date ISO de la commande. */
  date: string;
  /** Numéro déjà généré (commandes marketplace) — sinon dérivé du code. */
  invoiceNumber: string | null;
  statutPaiement: string | null;
  /** Code du moyen de paiement (WAVE, ESPECES…) — affiché en clair sur le PDF. */
  modePaiement?: string | null;
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
 * Facture d'une commande : téléchargement / impression / WhatsApp / e-mail —
 * fiable sur desktop, Android et iPhone (voir src/lib/pdf-delivery.ts).
 * Sur mobile, WhatsApp reçoit le PDF en VRAIE pièce jointe via la feuille de
 * partage native ; sur desktop, wa.me ne joignant pas de fichier, le PDF est
 * téléchargé puis la conversation pré-remplie s'ouvre.
 */
export function FactureCommandeButtons({
  boutiqueId,
  commandeId,
  boutique,
  commande,
  facturationEnabled = true,
}: {
  boutiqueId: string;
  commandeId: string;
  boutique: FactureBoutique;
  commande: FactureCommande;
  /** Capacité par plan, calculée CÔTÉ SERVEUR (les actions re-vérifient). */
  facturationEnabled?: boolean;
}) {
  const [mailBusy, setMailBusy] = useState(false);
  const date = new Date(commande.date);
  // Numérotation stable, alignée sur le marketplace : FAC-YYYYMMDD-<code>.
  const dateSuffix = date.toISOString().slice(0, 10).replace(/-/g, "");
  const invoiceNumber =
    commande.invoiceNumber || `FAC-${dateSuffix}-${commande.code.replace(/^CMD-/, "")}`;
  const paid = commande.statutPaiement === "CONFIRME";
  const clientName = commande.client
    ? [commande.client.prenom, commande.client.nom].filter(Boolean).join(" ").trim() || null
    : null;
  const fileName = `Facture-${commande.code}.pdf`;

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
      modePaiement: paymentMethodLabel(commande.modePaiement),
      settings: boutique.factureSettings,
    });
  }

  async function buildBlob(): Promise<Blob> {
    const doc = await buildPdf();
    return doc.output("blob");
  }

  async function printPdf() {
    try {
      printPdfBlob(await buildBlob());
    } catch {
      toast.error("Impression impossible.");
    }
  }

  async function downloadPdf() {
    try {
      const outcome = downloadPdfBlob(await buildBlob(), fileName);
      if (outcome === "opened") {
        toast.success("Facture ouverte — utilisez Partager → Enregistrer dans Fichiers.");
      }
    } catch {
      toast.error("Échec de la génération du PDF.");
    }
  }

  async function sendWhatsApp() {
    let blob: Blob;
    try {
      blob = await buildBlob();
    } catch {
      toast.error("Échec de la génération du PDF.");
      return;
    }

    // Mobile : feuille de partage native → le PDF part en PIÈCE JOINTE
    // (WhatsApp, Mail, etc.). Annulation utilisateur = pas d'erreur.
    if (canSharePdf()) {
      const shared = await sharePdfBlob(blob, fileName, {
        title: `Facture ${invoiceNumber}`,
        text: `Facture ${invoiceNumber} — ${boutique.nom} — ${formatCurrency(commande.total)}`,
      });
      if (shared === "shared") return;
      if (shared === "aborted") return;
      // "unsupported" → on retombe sur le flux wa.me ci-dessous.
    }

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
    downloadPdfBlob(blob, fileName);
    window.open(link, "_blank", "noopener,noreferrer");
    toast.success("Facture téléchargée — joignez le PDF dans WhatsApp.");
  }

  async function sendEmail() {
    if (!commande.client?.email?.trim()) {
      toast.error("Ce client n'a pas d'adresse e-mail. Ajoutez-la sur sa fiche client.");
      return;
    }
    setMailBusy(true);
    try {
      const res = await sendCommandeInvoiceByEmail({ boutiqueId, commandeId });
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      toast.success(`Facture envoyée par e-mail à ${res?.data?.email}.`);
    } catch {
      toast.error("L'envoi de l'e-mail a échoué. Veuillez réessayer.");
    } finally {
      setMailBusy(false);
    }
  }

  // Plan d'essai : pas de facturation → incitation propre, sans les boutons.
  if (!facturationEnabled) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
        <FileLock2 className="h-5 w-5 shrink-0 text-brand" />
        <div className="min-w-0">
          <p className="text-xs font-black">Facturation disponible avec un forfait payant</p>
          <Link href="/pricing" className="text-xs font-bold text-brand hover:underline">
            Voir les forfaits →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        className="h-10 flex-1 rounded-xl bg-[#25D366] font-bold text-white hover:bg-[#1ebe57] sm:flex-none"
        onClick={sendWhatsApp}
      >
        <MessageCircle className="mr-2 h-4 w-4" /> Envoyer sur WhatsApp
      </Button>
      <Button
        variant="outline"
        className="h-10 flex-1 rounded-xl font-bold sm:flex-none"
        onClick={sendEmail}
        disabled={mailBusy}
      >
        {mailBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
        E-mail
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
