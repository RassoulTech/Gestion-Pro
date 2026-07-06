"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { MessageCircleQuestion, X, Loader2, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitSupportMessage } from "@/server/actions/support.actions";
import { MOTIFS_VISITEUR, MOTIFS_VENDEUR } from "@/schemas/support.schema";

interface Props {
  /** VENDEUR = identité pré-remplie (affichage) ; l'action re-dérive de la session. */
  variant: "visiteur" | "vendeur";
  /** Pré-remplissage d'affichage pour le vendeur (nom, email). */
  prefill?: { nom: string; email: string };
  /** Rattachement boutique (vérifié côté serveur). */
  boutiqueId?: string;
  /** Décalage bas (mobile) pour ne pas chevaucher bottom-nav/FAB existants. */
  offsetClass?: string;
}

/**
 * Messagerie support/suggestions — bouton flottant + panneau (sans quitter la
 * page). Masqué automatiquement pendant le paiement (/checkout). Champ piège
 * `website` invisible (anti-bot). Texte 100 % français, tactile-first.
 */
export function SupportWidget({ variant, prefill, boutiqueId, offsetClass }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [motif, setMotif] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  // Exclusions : jamais pendant un paiement en cours.
  if (pathname?.startsWith("/checkout")) return null;

  const motifs = variant === "vendeur" ? MOTIFS_VENDEUR : MOTIFS_VISITEUR;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!motif) { toast.error("Choisissez un motif."); return; }
    setBusy(true);
    try {
      const res = await submitSupportMessage({
        nom: variant === "vendeur" ? undefined : nom,
        email: variant === "vendeur" ? undefined : email,
        telephone: telephone || undefined,
        motif: motif as "INFOS" | "ACCES" | "QUESTION" | "PROBLEME" | "SUGGESTION" | "AUTRE",
        message,
        boutiqueId,
        website,
      });
      if (res?.serverError) { toast.error(res.serverError); return; }
      if (res?.validationErrors) { toast.error("Vérifiez les champs saisis."); return; }
      setSent(true);
      setMessage(""); setMotif("");
    } catch {
      toast.error("L'envoi a échoué. Veuillez réessayer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Bouton flottant (gauche, pour ne pas gêner les FAB d'action à droite).
          Pastille de marque AVEC LIBELLÉ : l'utilisateur comprend l'utilité
          sans cliquer. Halo animé discret pour attirer l'œil (respecte
          prefers-reduced-motion via motion-safe). */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setSent(false); }}
        aria-label={open ? "Fermer l'aide" : variant === "vendeur" ? "Aide et suggestions" : "Besoin d'aide ?"}
        className={`group fixed left-4 z-40 flex h-12 items-center gap-2.5 rounded-full bg-gradient-to-br from-orange-600 to-orange-900 pl-2 pr-4 text-white shadow-xl shadow-orange-600/30 ring-1 ring-white/20 transition-all duration-200 hover:scale-[1.04] hover:shadow-orange-600/45 active:scale-95 ${offsetClass ?? "bottom-4"}`}
      >
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
          {!open && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-white/25 motion-safe:animate-ping [animation-duration:2.5s]" aria-hidden="true" />
          )}
          {open ? <X className="relative h-5 w-5" /> : <MessageCircleQuestion className="relative h-5 w-5" />}
        </span>
        <span className="text-[13px] font-black tracking-tight">
          {open ? "Fermer" : variant === "vendeur" ? "Aide & suggestions" : "Besoin d'aide ?"}
        </span>
      </button>

      {/* Panneau */}
      {open && (
        <div
          className={`fixed left-3 right-3 z-40 max-h-[75vh] overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl duration-200 animate-in fade-in slide-in-from-bottom-4 sm:left-4 sm:right-auto sm:w-[380px] dark:border-zinc-800 dark:bg-zinc-900 ${offsetClass ? "bottom-36 sm:bottom-24" : "bottom-20"}`}
          role="dialog"
          aria-label="Contacter l'équipe"
        >
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="font-black">Message envoyé !</p>
              <p className="text-sm font-medium text-zinc-500">
                Nous vous répondrons rapidement{variant === "vendeur" ? "" : " à l'adresse indiquée"}.
              </p>
              <Button variant="outline" className="mt-1 h-10 rounded-xl font-bold" onClick={() => setOpen(false)}>
                Fermer
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <p className="text-base font-black tracking-tight">
                  {variant === "vendeur" ? "Besoin d'aide ou une idée ?" : "Une question ? Un souci ?"}
                </p>
                <p className="mt-0.5 text-xs font-medium text-zinc-500">
                  {variant === "vendeur"
                    ? "Signalez un problème, posez une question ou suggérez une fonctionnalité."
                    : "Écrivez-nous, nous répondons rapidement par e-mail."}
                </p>
              </div>

              {variant === "vendeur" ? (
                <p className="rounded-xl bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-500 dark:bg-zinc-800/60">
                  {prefill?.nom} · {prefill?.email}
                </p>
              ) : (
                <>
                  <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Votre nom *" maxLength={80} required className="h-11 rounded-xl font-medium" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Votre e-mail *" maxLength={254} required className="h-11 rounded-xl font-medium" />
                  <Input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Téléphone / WhatsApp (optionnel)" maxLength={25} className="h-11 rounded-xl font-medium" />
                </>
              )}

              {/* Honeypot invisible (les humains ne le voient pas) */}
              <input
                type="text" tabIndex={-1} autoComplete="off" value={website}
                onChange={(e) => setWebsite(e.target.value)} name="website" aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />

              <div className="grid grid-cols-2 gap-2">
                {motifs.map((m) => (
                  <button
                    key={m.value} type="button" onClick={() => setMotif(m.value)}
                    className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition-colors ${
                      motif === m.value
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <Textarea
                value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Votre message… *" rows={4} maxLength={2000} required
                className="rounded-xl font-medium"
              />

              <Button type="submit" disabled={busy} variant="brand" className="h-11 w-full rounded-xl font-black">
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Envoyer
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
