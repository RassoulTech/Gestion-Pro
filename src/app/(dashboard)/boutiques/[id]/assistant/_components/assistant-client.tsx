"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  MessageCircle,
  Sparkles, Package, PenLine, History, Loader2, Copy, Check, Wand2, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDate } from "@/lib/utils";
import type { AiProductResult } from "@/lib/ai/tasks";
import { generateProductAI, improveDescriptionAI } from "@/server/actions/ai.actions";
import { ChatPanel } from "./chat-panel";

interface QuotaState {
  codePlan: string;
  quota: number;
  used: number;
  remaining: number;
  unlimited: boolean;
}
interface HistoryItem {
  id: string;
  type: string;
  prompt: string;
  response: string;
  createdAt: string;
}

const TYPE_LABEL: Record<string, string> = {
  PRODUCT: "Produit",
  DESCRIPTION: "Description",
  CHAT: "Chat",
  PRICE: "Prix",
  ANALYSIS: "Analyse",
  RESTOCK: "Réappro",
  INVOICE: "Facture",
  QUOTE: "Devis",
  MARKETING: "Marketing",
};

type Tab = "chat" | "produit" | "description" | "historique";

export function AssistantClient({
  boutiqueId,
  isMock,
  quota,
  history,
}: {
  boutiqueId: string;
  isMock: boolean;
  quota: QuotaState;
  history: HistoryItem[];
}) {
  const [tab, setTab] = useState<Tab>("chat");
  const [used, setUsed] = useState(quota.used);
  const [localHistory, setLocalHistory] = useState<HistoryItem[]>(history);

  const remaining = quota.unlimited ? Infinity : Math.max(0, quota.quota - used);
  const disabled = !quota.unlimited && remaining <= 0;
  const onUsed = () => setUsed((u) => u + 1);

  function pushHistory(type: string, prompt: string, response: string) {
    setLocalHistory((h) => [
      { id: Math.random().toString(36).slice(2), type, prompt, response, createdAt: new Date().toISOString() },
      ...h,
    ]);
  }

  const tabs: { value: Tab; label: string; icon: typeof Sparkles }[] = [
    { value: "chat", label: "Chat", icon: MessageCircle },
    { value: "produit", label: "Créer un produit", icon: Package },
    { value: "description", label: "Améliorer une description", icon: PenLine },
    { value: "historique", label: "Historique", icon: History },
  ];

  return (
    <div className="space-y-4">
      {/* Quota header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand/10 text-brand text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="h-3 w-3" /> Forfait {quota.codePlan}
            </span>
            {isMock && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase">
                Mode démo
              </span>
            )}
          </div>
          <div className="text-xs font-bold text-zinc-500">
            {quota.unlimited ? (
              <span className="text-emerald-600">Générations illimitées</span>
            ) : (
              <span>
                <span className={cn("font-black", remaining <= 0 ? "text-rose-500" : "text-zinc-800 dark:text-zinc-100")}>{used}</span> / {quota.quota} ce mois
              </span>
            )}
          </div>
        </div>
        {!quota.unlimited && (
          <div className="mt-3 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", remaining <= 0 ? "bg-rose-500" : "bg-brand")}
              style={{ width: `${Math.min(100, (used / Math.max(1, quota.quota)) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "shrink-0 inline-flex items-center gap-2 px-4 h-10 rounded-full text-xs font-black transition-colors border",
                tab === t.value
                  ? "bg-brand text-white border-brand"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-150 dark:border-zinc-800"
              )}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {disabled && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-xs font-bold text-rose-700 dark:text-rose-300">
          <Lock className="h-4 w-4 shrink-0" /> Quota IA mensuel atteint. Passez à un forfait supérieur pour continuer.
        </div>
      )}

      {tab === "chat" && <ChatPanel boutiqueId={boutiqueId} onUsed={onUsed} disabled={disabled} />}
      {tab === "produit" && (
        <ProductPanel boutiqueId={boutiqueId} disabled={disabled} onUsed={onUsed} onHistory={pushHistory} />
      )}
      {tab === "description" && (
        <DescriptionPanel boutiqueId={boutiqueId} disabled={disabled} onUsed={onUsed} onHistory={pushHistory} />
      )}
      {tab === "historique" && <HistoryPanel items={localHistory} />}
    </div>
  );
}

function CopyButton({ text, label = "Copier" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      className="h-9 rounded-xl font-bold text-xs"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          toast.success("Copié");
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast.error("Copie impossible");
        }
      }}
    >
      {done ? <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}

const card = "bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] p-5 sm:p-6 shadow-sm";

function ProductPanel({
  boutiqueId, disabled, onUsed, onHistory,
}: {
  boutiqueId: string; disabled: boolean; onUsed: () => void; onHistory: (t: string, p: string, r: string) => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiProductResult | null>(null);

  async function run() {
    if (!input.trim() || loading || disabled) return;
    setLoading(true);
    try {
      const r = await generateProductAI({ boutiqueId, input });
      if (r?.serverError) return toast.error(r.serverError);
      if (r?.data?.result) {
        setResult(r.data.result);
        onUsed();
        onHistory("PRODUCT", input, JSON.stringify(r.data.result));
      }
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className={card}>
        <Label className="text-xs font-bold">Décrivez le produit en quelques mots</Label>
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="Ex. Coca Cola 1L, Ordinateur HP Elitebook, Chaussure Nike Air Max…"
            className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none font-semibold text-sm"
            disabled={disabled}
          />
          <Button onClick={run} disabled={loading || disabled || !input.trim()} variant="brand" className="h-12 rounded-xl font-black px-5 shrink-0">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Générer
          </Button>
        </div>
      </div>

      {result && (
        <div className={cn(card, "space-y-4")}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-black text-lg">{result.nom}</h3>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-brand/10 text-brand text-[10px] font-black uppercase">{result.categorie}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <Field label="Catégorie" value={result.categorie} />
            <Field label="Sous-catégorie" value={result.sousCategorie || "—"} />
            <Field label="Unité" value={result.unite} />
            <Field label="Prix conseillé" value={result.prixConseille ? `${result.prixConseille} FCFA` : "—"} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">Description</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{result.description}</p>
          </div>
          {result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.tags.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-300">#{t}</span>
              ))}
            </div>
          )}
          {result.caracteristiques.length > 0 && (
            <ul className="list-disc list-inside text-xs text-zinc-600 dark:text-zinc-300 space-y-0.5">
              {result.caracteristiques.map((c) => <li key={c}>{c}</li>)}
            </ul>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <CopyButton text={result.description} label="Copier la description" />
            <CopyButton text={`${result.nom}\n${result.description}\nCatégorie: ${result.categorie}\nUnité: ${result.unite}\nTags: ${result.tags.join(", ")}`} label="Tout copier" />
          </div>
          <p className="text-[11px] text-zinc-400 font-medium">Vérifiez et ajustez avant de créer le produit — l'IA ne crée rien automatiquement.</p>
        </div>
      )}
    </div>
  );
}

function DescriptionPanel({
  boutiqueId, disabled, onUsed, onHistory,
}: {
  boutiqueId: string; disabled: boolean; onUsed: () => void; onHistory: (t: string, p: string, r: string) => void;
}) {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState<"pro" | "commercial" | "court" | "detaille">("pro");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const tones: { value: typeof tone; label: string }[] = [
    { value: "pro", label: "Professionnelle" },
    { value: "commercial", label: "Commerciale" },
    { value: "court", label: "Courte" },
    { value: "detaille", label: "Détaillée" },
  ];

  async function run() {
    if (!nom.trim() || loading || disabled) return;
    setLoading(true);
    try {
      const r = await improveDescriptionAI({ boutiqueId, nom, description, tone });
      if (r?.serverError) return toast.error(r.serverError);
      if (r?.data?.result) {
        setResult(r.data.result);
        onUsed();
        onHistory("DESCRIPTION", `${nom} (${tone})`, r.data.result);
      }
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className={cn(card, "space-y-3")}>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold">Nom du produit</Label>
          <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Chaussure Nike Air Max" className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none font-semibold text-sm" disabled={disabled} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold">Description actuelle (optionnel)</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Collez la description à améliorer…" className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none text-sm min-h-[80px]" disabled={disabled} />
        </div>
        <div className="flex flex-wrap gap-2">
          {tones.map((t) => (
            <button key={t.value} onClick={() => setTone(t.value)} disabled={disabled}
              className={cn("px-3 h-9 rounded-full text-xs font-black border transition-colors",
                tone === t.value ? "bg-brand text-white border-brand" : "bg-zinc-50 dark:bg-zinc-800 border-transparent text-zinc-600 dark:text-zinc-300")}>
              {t.label}
            </button>
          ))}
        </div>
        <Button onClick={run} disabled={loading || disabled || !nom.trim()} variant="brand" className="h-11 rounded-xl font-black w-full sm:w-auto px-5">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          Améliorer avec IA
        </Button>
      </div>

      {result && (
        <div className={cn(card, "space-y-3")}>
          <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Proposition</p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">{result}</p>
          <CopyButton text={result} />
        </div>
      )}
    </div>
  );
}

function HistoryPanel({ items }: { items: HistoryItem[] }) {
  if (items.length === 0) {
    return (
      <div className={cn(card, "text-center py-12")}>
        <History className="h-10 w-10 mx-auto text-zinc-300" />
        <p className="font-black mt-3 text-zinc-700 dark:text-zinc-200">Aucune génération pour l'instant</p>
        <p className="text-xs text-zinc-500 mt-1">Vos créations IA s'afficheront ici.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((h) => (
        <div key={h.id} className={cn(card, "space-y-2 p-4 sm:p-5")}>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-black uppercase">{TYPE_LABEL[h.type] ?? h.type}</span>
            <span className="text-[10px] font-bold text-zinc-400">{formatDate(h.createdAt)}</span>
          </div>
          <p className="text-xs font-bold text-zinc-500 truncate">{h.prompt}</p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-3 whitespace-pre-line">
            {h.type === "PRODUCT" ? safeProductSummary(h.response) : h.response}
          </p>
        </div>
      ))}
    </div>
  );
}

function safeProductSummary(json: string): string {
  try {
    const p = JSON.parse(json) as AiProductResult;
    return `${p.nom} — ${p.description}`;
  } catch {
    return json;
  }
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">{value}</p>
    </div>
  );
}
