"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Combien ai-je vendu ce mois ?",
  "Quel produit se vend le mieux ?",
  "Quels produits risquent une rupture ?",
  "Quels sont mes meilleurs clients ?",
];

export function ChatPanel({
  boutiqueId,
  onUsed,
  disabled,
}: {
  boutiqueId: string;
  onUsed: () => void;
  disabled: boolean;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    if (disabled) {
      toast.error("Quota IA mensuel atteint. Passez à un forfait supérieur.");
      return;
    }
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ boutiqueId, messages: next }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        setMessages(next);
        toast.error(err.error || "Erreur de l'assistant.");
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((m) => {
          const c = [...m];
          c[c.length - 1] = { role: "assistant", content: acc };
          return c;
        });
      }
      onUsed();
    } catch {
      setMessages(next);
      toast.error("Connexion interrompue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[62vh] sm:h-[65vh] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand to-slate-800 flex items-center justify-center text-white shadow-lg">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <p className="font-black text-zinc-800 dark:text-zinc-100">Posez une question sur votre boutique</p>
              <p className="text-xs text-zinc-500 mt-1">Les réponses s'appuient sur vos données réelles.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={disabled}
                  className="text-left text-xs font-bold rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 hover:border-brand/40 hover:bg-brand/5 transition-colors disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={cn("flex gap-2.5", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "assistant" && (
                <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-br from-brand to-slate-800 flex items-center justify-center text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[82%] rounded-2xl px-4 py-2.5 text-sm font-medium whitespace-pre-line leading-relaxed",
                  m.role === "user"
                    ? "bg-brand text-white rounded-br-sm"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-bl-sm"
                )}
              >
                {m.content || (loading && i === messages.length - 1 ? <Loader2 className="h-4 w-4 animate-spin" /> : "")}
              </div>
              {m.role === "user" && (
                <div className="h-8 w-8 shrink-0 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 p-3 flex items-end gap-2 bg-white dark:bg-zinc-900">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder={disabled ? "Quota mensuel atteint" : "Écrivez votre question…"}
          disabled={disabled}
          className="flex-1 resize-none max-h-28 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-150 dark:border-zinc-700 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50"
        />
        <Button
          onClick={() => send()}
          disabled={loading || !input.trim() || disabled}
          variant="brand"
          className="h-12 w-12 shrink-0 rounded-2xl p-0"
          aria-label="Envoyer"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}
