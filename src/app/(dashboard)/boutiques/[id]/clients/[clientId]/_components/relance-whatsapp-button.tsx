"use client";

import { useState } from "react";
import { Loader2, Sparkles, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/icons/brand-icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateClientRelanceAI } from "@/server/actions/ai.actions";

/**
 * Relance client par WhatsApp : l'IA rédige un message personnalisé
 * (historique d'achats), le vendeur le relit/modifie puis l'envoie via wa.me.
 * Consomme un crédit IA par génération.
 */
export function RelanceWhatsappButton({
  boutiqueId,
  clientId,
  telephone,
}: {
  boutiqueId: string;
  clientId: string;
  telephone: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");


  async function generate() {
    setLoading(true);
    try {
      const r = await generateClientRelanceAI({ boutiqueId, clientId });
      if (r?.serverError) {
        toast.error(r.serverError);
        return;
      }
      if (r?.data?.message) {
        setMessage(r.data.message);
      } else {
        toast.error("Génération impossible pour le moment.");
      }
    } catch {
      toast.error("Génération impossible pour le moment.");
    } finally {
      setLoading(false);
    }
  }

  function openWhatsapp() {
    if (!telephone || !message.trim()) return;
    const url = buildWhatsAppLink(telephone, message.trim());
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      toast.error("Numéro de téléphone invalide.");
    }
  }

  if (!telephone) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto h-11 rounded-xl font-bold"
        onClick={() => {
          setOpen(true);
          if (!message) void generate();
        }}
      >
        <WhatsAppIcon className="mr-2 h-4 w-4 text-emerald-600" />
        Relance WhatsApp
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand" /> Relance WhatsApp
            </DialogTitle>
            <DialogDescription>
              Message rédigé par l&apos;IA d&apos;après l&apos;historique du client — relisez et ajustez
              avant l&apos;envoi.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-semibold">Rédaction du message…</span>
            </div>
          ) : (
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="rounded-xl font-medium text-sm leading-relaxed"
              placeholder="Le message généré apparaîtra ici."
            />
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-xl font-bold"
              onClick={generate}
              disabled={loading}
            >
              <Sparkles className="mr-2 h-4 w-4" /> Régénérer
            </Button>
            <Button
              type="button"
              variant="brand"
              className="h-11 rounded-xl font-black"
              onClick={openWhatsapp}
              disabled={loading || !message.trim()}
            >
              <ExternalLink className="mr-2 h-4 w-4" /> Ouvrir WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
