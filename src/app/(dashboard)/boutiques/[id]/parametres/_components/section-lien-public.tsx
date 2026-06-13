"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, ExternalLink, Share2, Check, Loader2, Link2, Sparkles, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, slugify } from "@/lib/utils";
import { updateBoutiqueSlug } from "@/server/actions/boutique.actions";

interface Props {
  boutiqueId: string;
  slug: string;
  planCode: string;
}

export function SectionLienPublic({ boutiqueId, slug: initialSlug, planCode }: Props) {
  const router = useRouter();
  const [slug, setSlug] = useState(initialSlug);
  const [origin, setOrigin] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialSlug);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  const canCustomize = planCode === "PRO" || planCode === "ENTERPRISE";

  useEffect(() => {
    setOrigin(window.location.origin);
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const url = `${origin}/s/${slug}`;
  const displayUrl = `${origin.replace(/^https?:\/\//, "")}/s/${slug}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien copié");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible");
    }
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Ma boutique", text: "Découvrez ma boutique en ligne", url });
      } catch {
        /* user cancelled */
      }
    } else {
      copyLink();
    }
  }

  async function saveSlug() {
    const cleaned = slugify(draft);
    if (cleaned.length < 3) {
      toast.error("Le lien doit contenir au moins 3 caractères.");
      return;
    }
    setLoading(true);
    try {
      const r = await updateBoutiqueSlug({ boutiqueId, slug: cleaned });
      if (r?.serverError) {
        toast.error(r.serverError);
        return;
      }
      const newSlug = r?.data?.slug ?? cleaned;
      setSlug(newSlug);
      setDraft(newSlug);
      setEditing(false);
      toast.success("Lien mis à jour");
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-brand/5 border border-brand/10">
        <Link2 className="h-4 w-4 text-brand mt-0.5 shrink-0" />
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
          Partagez ce lien à vos clients : il ouvre une <strong>vitrine dédiée</strong> à votre boutique
          (logo, produits, contact WhatsApp), distincte du marketplace global.
        </p>
      </div>

      {/* URL card */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 space-y-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Votre lien public</p>
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 px-4 py-3 overflow-hidden">
            <Link2 className="h-4 w-4 text-brand shrink-0" />
            <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100 truncate">{displayUrl}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button onClick={copyLink} variant="outline" className="h-11 rounded-xl font-bold text-xs">
            {copied ? <Check className="mr-1.5 h-4 w-4 text-emerald-500" /> : <Copy className="mr-1.5 h-4 w-4" />}
            Copier
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-xl font-bold text-xs">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-4 w-4" /> Ouvrir
            </a>
          </Button>
          <Button onClick={shareLink} variant="outline" className="h-11 rounded-xl font-bold text-xs">
            <Share2 className="mr-1.5 h-4 w-4" /> {canShare ? "Partager" : "Copier"}
          </Button>
        </div>
      </div>

      {/* Customize slug */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Pencil className="h-4 w-4 text-brand" /> Personnaliser le lien
            </h4>
            <p className="text-xs font-medium text-zinc-500 mt-1">Choisissez une adresse claire et mémorable.</p>
          </div>
          {!canCustomize && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase">
              <Sparkles className="h-3 w-3" /> Pro
            </span>
          )}
        </div>

        {!canCustomize ? (
          <p className="text-xs font-semibold text-zinc-500 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
            La personnalisation du lien est incluse dans les forfaits <strong>Pro</strong> et <strong>Enterprise</strong>.
          </p>
        ) : editing ? (
          <div className="space-y-3">
            <div className="flex items-stretch rounded-xl bg-zinc-50 dark:bg-zinc-800 overflow-hidden">
              <span className="flex items-center px-3 text-xs font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-700/50 whitespace-nowrap">/s/</span>
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="h-11 border-none bg-transparent font-semibold text-sm focus-visible:ring-0"
                placeholder="ma-boutique"
                autoFocus
              />
            </div>
            <p className="text-[11px] font-medium text-zinc-400">
              Aperçu : <span className="font-bold text-zinc-600 dark:text-zinc-300">/s/{slugify(draft) || "…"}</span>
            </p>
            <div className="flex gap-2">
              <Button onClick={saveSlug} disabled={loading} variant="brand" className="h-10 rounded-xl font-bold text-xs flex-1">
                {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
                Enregistrer
              </Button>
              <Button onClick={() => { setEditing(false); setDraft(slug); }} variant="outline" className="h-10 rounded-xl font-bold text-xs">
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setEditing(true)} variant="outline" className={cn("h-11 rounded-xl font-bold text-xs")}>
            <Pencil className="mr-1.5 h-4 w-4" /> Modifier le lien
          </Button>
        )}
      </div>
    </div>
  );
}
