"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Download, Printer, Trash2, Loader2, CheckCircle2, Clock, Ban, Package, MessageCircle, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { FACTURE_STATUT_CONFIG } from "@/lib/facture-statut";
import type { FactureStatut } from "@/schemas/facture.schema";
import { generateInvoicePDF } from "@/lib/generate-invoice";
import { buildInvoiceWhatsAppLink } from "@/lib/whatsapp";
import {
  canSharePdf,
  downloadPdfBlob,
  printPdfBlob,
  sharePdfBlob,
} from "@/lib/pdf-delivery";
import { updateFactureStatut, deleteFacture, sendFactureByEmail } from "@/server/actions/facture.actions";

interface FactureDetailData {
  id: string;
  numero: string;
  date: string;
  statut: FactureStatut;
  clientNom: string | null;
  clientTelephone: string | null;
  clientEmail: string | null;
  clientAdresse: string | null;
  sousTotal: number;
  remise: number;
  tauxTva: number;
  montantTva: number;
  total: number;
  stockDeduit: boolean;
  notes: string | null;
  lignes: { id: string; designation: string; quantite: number; prixUnitaire: number }[];
  boutique: {
    nom: string; logo: string | null; telephone: string | null; email: string | null; adresse: string | null;
    /** Personnalisation de la facture (Boutique.factureSettings, jsonb brut). */
    factureSettings?: unknown;
  };
}

export function FactureDetail({ boutiqueId, facture }: { boutiqueId: string; facture: FactureDetailData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const cfg = FACTURE_STATUT_CONFIG[facture.statut];

  function buildPdf() {
    return generateInvoicePDF({
      invoiceNumber: facture.numero,
      date: new Date(facture.date),
      status: facture.statut,
      statusLabel: cfg.label,
      boutique: facture.boutique,
      client: {
        nom: facture.clientNom || "Client occasionnel",
        prenom: null,
        telephone: facture.clientTelephone,
        email: facture.clientEmail,
        adresse: facture.clientAdresse,
      },
      lignes: facture.lignes.map((l) => ({ nom: l.designation, quantite: l.quantite, prixUnitaire: l.prixUnitaire })),
      total: facture.total,
      remise: facture.remise,
      montantTva: facture.montantTva,
      tauxTva: facture.tauxTva,
      notes: facture.notes,
      settings: facture.boutique.factureSettings,
    });
  }

  async function buildBlob(): Promise<Blob> {
    const doc = await buildPdf();
    return doc.output("blob");
  }

  async function downloadPdf() {
    try {
      const outcome = downloadPdfBlob(await buildBlob(), `${facture.numero}.pdf`);
      if (outcome === "opened") {
        toast.success("Facture ouverte — utilisez Partager → Enregistrer dans Fichiers.");
      }
    } catch {
      toast.error("Échec de la génération du PDF.");
    }
  }
  async function printPdf() {
    try {
      printPdfBlob(await buildBlob());
    } catch {
      toast.error("Impression impossible.");
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

    // Mobile : feuille de partage native → PDF en VRAIE pièce jointe (WhatsApp…).
    if (canSharePdf()) {
      const shared = await sharePdfBlob(blob, `${facture.numero}.pdf`, {
        title: `Facture ${facture.numero}`,
        text: `Facture ${facture.numero} — ${facture.boutique.nom} — ${formatCurrency(facture.total)}`,
      });
      if (shared === "shared" || shared === "aborted") return;
      // "unsupported" → flux wa.me ci-dessous.
    }

    const link = buildInvoiceWhatsAppLink({
      phone: facture.clientTelephone,
      invoiceNumber: facture.numero,
      totalLabel: formatCurrency(facture.total),
      shopName: facture.boutique.nom,
      clientName: facture.clientNom,
    });
    if (!link) {
      toast.error("Numéro WhatsApp du client manquant ou invalide.");
      return;
    }
    // wa.me ne joint pas de fichier : on télécharge le PDF (prêt à joindre) puis
    // on ouvre WhatsApp avec le bon numéro et un message clair.
    downloadPdfBlob(blob, `${facture.numero}.pdf`);
    window.open(link, "_blank", "noopener,noreferrer");
    toast.success("Facture téléchargée — joignez le PDF dans WhatsApp.");
  }

  async function sendEmail() {
    if (!facture.clientEmail?.trim()) {
      toast.error("Aucune adresse e-mail sur cette facture. Renseignez l'e-mail du client.");
      return;
    }
    setBusy(true);
    try {
      const r = await sendFactureByEmail({ boutiqueId, factureId: facture.id });
      if (r?.serverError) return toast.error(r.serverError);
      toast.success(`Facture envoyée par e-mail à ${r?.data?.email}.`);
    } catch {
      toast.error("L'envoi de l'e-mail a échoué. Veuillez réessayer.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatut(statut: FactureStatut) {
    setBusy(true);
    try {
      const r = await updateFactureStatut({ boutiqueId, factureId: facture.id, data: { statut } });
      if (r?.serverError) return toast.error(r.serverError);
      toast.success("Statut mis à jour");
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      const r = await deleteFacture({ boutiqueId, factureId: facture.id });
      if (r?.serverError) return toast.error(r.serverError);
      toast.success("Facture supprimée");
      router.push(`/boutiques/${boutiqueId}/factures`);
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  const statutActions: { statut: FactureStatut; label: string; icon: typeof CheckCircle2; cls: string }[] = [
    { statut: "PAYEE", label: "Payée", icon: CheckCircle2, cls: "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/40 dark:text-emerald-400" },
    { statut: "IMPAYEE", label: "Impayée", icon: Clock, cls: "border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-900/40 dark:text-amber-400" },
    { statut: "ANNULEE", label: "Annuler", icon: Ban, cls: "border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-400" },
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      {/* Aperçu */}
      <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] p-5 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">{facture.boutique.nom}</h2>
            <div className="text-xs font-semibold text-zinc-500 mt-1 space-y-0.5">
              {facture.boutique.adresse && <p>{facture.boutique.adresse}</p>}
              {facture.boutique.telephone && <p>Tél : {facture.boutique.telephone}</p>}
              {facture.boutique.email && <p>{facture.boutique.email}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-brand font-black text-lg">FACTURE</p>
            <p className="text-xs font-bold text-zinc-500"># {facture.numero}</p>
            <span className={cn("mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase", cfg.badge)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} /> {cfg.label}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-4 py-6 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Facturé à</p>
            <p className="font-black text-zinc-900 dark:text-zinc-100 mt-1">{facture.clientNom || "Client occasionnel"}</p>
            <div className="text-xs font-semibold text-zinc-500 mt-0.5 space-y-0.5">
              {facture.clientTelephone && <p>{facture.clientTelephone}</p>}
              {facture.clientEmail && <p>{facture.clientEmail}</p>}
              {facture.clientAdresse && <p>{facture.clientAdresse}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Date</p>
            <p className="font-bold text-zinc-700 dark:text-zinc-300 mt-1">{formatDate(facture.date)}</p>
          </div>
        </div>

        {/* Lignes */}
        <div className="py-4 space-y-2">
          {facture.lignes.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-3 py-2 border-b border-zinc-50 dark:border-zinc-800/50 last:border-0">
              <div className="min-w-0">
                <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200 truncate">{l.designation}</p>
                <p className="text-[11px] font-semibold text-zinc-400">{l.quantite} × {formatCurrency(l.prixUnitaire)}</p>
              </div>
              <p className="font-black text-sm whitespace-nowrap">{formatCurrency(l.quantite * l.prixUnitaire)}</p>
            </div>
          ))}
        </div>

        {/* Totaux */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2 text-sm max-w-xs ml-auto">
          <div className="flex justify-between font-semibold text-zinc-500"><span>Sous-total</span><span>{formatCurrency(facture.sousTotal)}</span></div>
          {facture.remise > 0 && <div className="flex justify-between font-semibold text-rose-500"><span>Remise</span><span>- {formatCurrency(facture.remise)}</span></div>}
          {facture.montantTva > 0 && <div className="flex justify-between font-semibold text-zinc-500"><span>TVA ({facture.tauxTva} %)</span><span>{formatCurrency(facture.montantTva)}</span></div>}
          <div className="flex justify-between text-base font-black pt-1"><span>Total</span><span className="text-brand">{formatCurrency(facture.total)}</span></div>
        </div>

        {facture.notes && (
          <div className="mt-6 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 text-xs font-medium text-zinc-600 dark:text-zinc-300 whitespace-pre-line">
            <span className="font-black uppercase tracking-wider text-zinc-400 text-[10px] block mb-1">Notes</span>
            {facture.notes}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] p-5 sm:p-6 shadow-sm space-y-3 lg:sticky lg:top-6">
          <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400">Document</h3>
          <Button onClick={downloadPdf} variant="brand" className="w-full h-12 rounded-xl font-black shadow-lg shadow-brand/20">
            <Download className="mr-2 h-4 w-4" /> Télécharger le PDF
          </Button>
          <Button onClick={printPdf} variant="outline" className="w-full h-11 rounded-xl font-bold">
            <Printer className="mr-2 h-4 w-4" /> Imprimer
          </Button>
          <Button
            onClick={sendWhatsApp}
            className="w-full h-11 rounded-xl bg-[#25D366] font-bold text-white hover:bg-[#1ebe57]"
          >
            <MessageCircle className="mr-2 h-4 w-4" /> Envoyer sur WhatsApp
          </Button>
          <Button onClick={sendEmail} disabled={busy} variant="outline" className="w-full h-11 rounded-xl font-bold">
            <Mail className="mr-2 h-4 w-4" /> Envoyer par e-mail
          </Button>

          <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400 pt-2">Statut</h3>
          <div className="grid grid-cols-1 gap-2">
            {statutActions.map((a) => {
              const Icon = a.icon;
              const active = facture.statut === a.statut;
              return (
                <Button
                  key={a.statut}
                  onClick={() => changeStatut(a.statut)}
                  disabled={busy || active}
                  variant="outline"
                  className={cn("h-11 rounded-xl font-bold justify-start", a.cls, active && "opacity-50")}
                >
                  <Icon className="mr-2 h-4 w-4" /> {active ? `Déjà ${a.label.toLowerCase()}` : `Marquer ${a.label.toLowerCase()}`}
                </Button>
              );
            })}
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" disabled={busy} className="w-full h-11 rounded-xl font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 mt-1">
                <Trash2 className="mr-2 h-4 w-4" /> Supprimer la facture
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer cette facture ?</AlertDialogTitle>
                <AlertDialogDescription>
                  La facture <strong>{facture.numero}</strong> sera définitivement supprimée. Le stock déduit (le cas échéant) sera restitué. Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-rose-600 hover:bg-rose-700">
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {facture.stockDeduit && (
            <p className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 pt-1">
              <Package className="h-3.5 w-3.5" /> Stock déduit de l&apos;inventaire
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
