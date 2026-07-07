"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Wand2, Camera, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AiProductResult } from "@/lib/ai/tasks";
import {
  generateProductAI,
  generateProductFromImageAI,
  getAiQuotaStateAction,
} from "@/server/actions/ai.actions";

interface QuotaState {
  quota: number;
  used: number;
  remaining: number;
  unlimited: boolean;
  codePlan: string;
  mode?: "anthropic" | "openai" | "mock";
}

const FAIL_MSG = "Impossible de générer automatiquement les informations. Veuillez compléter manuellement.";

export function AiProductAssistant({
  boutiqueId,
  onApply,
}: {
  boutiqueId: string;
  onApply: (result: AiProductResult, prompt: string) => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [result, setResult] = useState<AiProductResult | null>(null);
  const [imageResults, setImageResults] = useState<AiProductResult[]>([]);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAiQuotaStateAction()
      .then((r) => r?.data && setQuota(r.data))
      .catch(() => {});
  }, []);

  const disabled = quota ? !quota.unlimited && quota.remaining <= 0 : false;
  const busy = loading || imgLoading;

  function bump() {
    setQuota((q) =>
      q ? { ...q, used: q.used + 1, remaining: q.unlimited ? q.remaining : Math.max(0, q.remaining - 1) } : q
    );
  }

  async function runText() {
    if (!input.trim() || busy || disabled) return;
    setLoading(true);
    setErr("");
    try {
      const r = await generateProductAI({ boutiqueId, input });
      if (r?.serverError) {
        setErr(r.serverError);
        toast.error(r.serverError);
        return;
      }
      if (r?.data?.result) {
        setResult(r.data.result);
        onApply(r.data.result, input.trim());
        bump();
        toast.success("Champs pré-remplis par l'IA ✨");
      } else {
        setErr(FAIL_MSG);
      }
    } catch {
      setErr(FAIL_MSG);
    } finally {
      setLoading(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (disabled) {
      toast.error("Quota IA mensuel atteint.");
      return;
    }
    if (file.size > 6_000_000) {
      toast.error("Image trop lourde (max 6 Mo).");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setImgLoading(true);
    setErr("");
    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result));
        fr.onerror = rej;
        fr.readAsDataURL(file);
      });
      const [meta, b64] = dataUrl.split(",");
      const mime = meta?.match(/data:(.*?);/)?.[1] || file.type || "image/jpeg";
      const r = await generateProductFromImageAI({ boutiqueId, imageBase64: b64 || "", mimeType: mime });
      if (r?.serverError) {
        setErr(r.serverError);
        toast.error(r.serverError);
        return;
      }
      if (r?.data?.confident && r.data.result) {
        const all = r.data.results ?? [r.data.result];
        setResult(r.data.result);
        setImageResults(all.length > 1 ? all : []);
        onApply(r.data.result, "[image]");
        bump();
        toast.success(
          all.length > 1
            ? `${all.length} produits détectés — le premier est pré-rempli ✨`
            : "Champs pré-remplis depuis l'image ✨"
        );
      } else {
        setErr(FAIL_MSG);
      }
    } catch {
      setErr(FAIL_MSG);
    } finally {
      setImgLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="relative rounded-[1.75rem] p-[1.5px] bg-gradient-to-r from-brand/40 via-brand/10 to-transparent">
      <div className="rounded-[1.65rem] bg-white dark:bg-zinc-900 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-200">Assistant IA Produit</span>
          </div>
          {quota && (
            <span className={cn("text-[10px] font-black", disabled ? "text-red-500" : "text-zinc-400")}>
              {quota.unlimited ? "Illimité" : `${quota.remaining} restante${quota.remaining > 1 ? "s" : ""}`}
            </span>
          )}
        </div>

        <p className="text-[11px] font-medium text-zinc-400">
          Décrivez votre produit, l&apos;IA pré-remplit le formulaire. Vous gardez le contrôle.
        </p>

        {quota?.mode === "mock" && (
          <div className="flex items-start gap-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-xl px-3 py-2">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Mode aperçu : aucune clé IA n&apos;est configurée sur ce serveur — les suggestions sont simulées.
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), runText())}
            placeholder="Ex. Coca Cola 1L, Sac à dos Adidas, Riz parfumé 25 kg…"
            disabled={disabled || busy}
            className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none font-semibold text-sm"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={runText}
              disabled={busy || disabled || !input.trim()}
              variant="brand"
              className="h-12 rounded-xl font-black px-4 flex-1 sm:flex-none"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
              Générer
            </Button>
            <Button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy || disabled}
              variant="outline"
              className="h-12 rounded-xl font-bold px-4 shrink-0"
              aria-label="Générer depuis une image"
            >
              {imgLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4 sm:mr-2" />}
              <span className="hidden sm:inline">Image</span>
            </Button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
          </div>
        </div>

        {err && (
          <div className="flex items-start gap-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-xl px-3 py-2">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {err}
          </div>
        )}

        {result && !err && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mr-1">Suggestions :</span>
            {result.categorie && <Chip>{result.categorie}</Chip>}
            {result.sousCategorie && <Chip>{result.sousCategorie}</Chip>}
            {result.unite && <Chip>Unité : {result.unite}</Chip>}
            {result.tags.slice(0, 5).map((t) => (
              <Chip key={t}>#{t}</Chip>
            ))}
          </div>
        )}

        {imageResults.length > 1 && !err && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mr-1">
              {imageResults.length} produits détectés — cliquez pour remplir :
            </span>
            {imageResults.map((p, i) => (
              <button
                key={`${p.nom}-${i}`}
                type="button"
                onClick={() => {
                  setResult(p);
                  onApply(p, "[image]");
                  toast.success(`« ${p.nom} » appliqué au formulaire`);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors",
                  result?.nom === p.nom
                    ? "bg-brand text-white border-transparent"
                    : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-brand/50"
                )}
              >
                {p.nom}
              </button>
            ))}
          </div>
        )}

        {disabled && (
          <p className="text-[11px] font-bold text-red-500">
            Quota IA mensuel atteint. Passez à un forfait supérieur pour continuer à utiliser l&apos;IA.
          </p>
        )}
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
      {children}
    </span>
  );
}
