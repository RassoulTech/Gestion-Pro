"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Store, User, MessageCircle, Mail, Loader2, Archive, Send, ChevronLeft, ChevronRight, Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { internationalizeNumber } from "@/lib/whatsapp";
import { MOTIF_LABELS } from "@/schemas/support.schema";
import { replySupportMessage, setSupportMessageStatut } from "@/server/actions/support.actions";

type Msg = {
  id: string; nom: string; email: string; telephone: string | null;
  senderType: string; motif: string; message: string; statut: string;
  createdAt: string; vendeurId: string | null; boutiqueId: string | null;
  boutiqueNom: string | null; historyCount: number;
  replies: { id: string; body: string; createdAt: string }[];
};

const STATUT_STYLE: Record<string, string> = {
  NOUVEAU: "bg-brand/10 text-brand border-brand/20",
  LU: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  REPONDU: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  ARCHIVE: "bg-zinc-100 text-zinc-400 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800",
};
const STATUT_LABEL: Record<string, string> = { NOUVEAU: "Nouveau", LU: "Lu", REPONDU: "Répondu", ARCHIVE: "Archivé" };

export function MessagesClient({
  messages, total, page, pageSize, filters,
}: {
  messages: Msg[]; total: number; page: number; pageSize: number;
  filters: { statut: string; type: string; motif: string; q: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  async function openMessage(m: Msg) {
    setOpenId(openId === m.id ? null : m.id);
    setReply("");
    if (m.statut === "NOUVEAU") {
      await setSupportMessageStatut({ messageId: m.id, statut: "LU" });
      router.refresh();
    }
  }

  async function sendReply(m: Msg) {
    setBusy(true);
    try {
      const res = await replySupportMessage({ messageId: m.id, body: reply });
      if (res?.serverError) { toast.error(res.serverError); return; }
      toast.success(`Réponse envoyée par e-mail à ${m.email}.`);
      setReply("");
      router.refresh();
    } catch {
      toast.error("L'envoi a échoué.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          defaultValue={filters.q} placeholder="Rechercher (nom, e-mail, texte)…"
          onKeyDown={(e) => { if (e.key === "Enter") setFilter("q", (e.target as HTMLInputElement).value); }}
          className="h-10 w-full rounded-xl font-medium sm:w-64"
        />
        {[
          ["statut", filters.statut, [["", "Tous statuts"], ["NOUVEAU", "Nouveau"], ["LU", "Lu"], ["REPONDU", "Répondu"], ["ARCHIVE", "Archivé"]]],
          ["type", filters.type, [["", "Tous publics"], ["VISITEUR", "Visiteur"], ["VENDEUR", "Vendeur"]]],
          ["motif", filters.motif, [["", "Tous motifs"], ["SUGGESTION", "💡 Suggestions"], ["PROBLEME", "Problème technique"], ["ACCES", "Inscription / accès"], ["QUESTION", "Question"], ["INFOS", "Informations"], ["AUTRE", "Autre"]]],
        ].map(([key, current, options]) => (
          <select
            key={key as string} value={current as string}
            onChange={(e) => setFilter(key as string, e.target.value)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            {(options as [string, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
      </div>

      {/* Liste */}
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {messages.length === 0 ? (
          <p className="p-10 text-center text-sm font-semibold text-zinc-400">Aucun message ne correspond aux filtres.</p>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {messages.map((m) => (
              <div key={m.id}>
                <button type="button" onClick={() => openMessage(m)} className="w-full p-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${m.senderType === "VENDEUR" ? "border-blue-500/20 bg-blue-500/10 text-blue-600" : "border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                      {m.senderType === "VENDEUR" ? <Store className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {m.senderType === "VENDEUR" ? "Vendeur" : "Visiteur"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500">
                      {m.motif === "SUGGESTION" && <Lightbulb className="h-3 w-3 text-amber-500" />}
                      {MOTIF_LABELS[m.motif] ?? m.motif}
                    </span>
                    <span className={`ml-auto rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${STATUT_STYLE[m.statut] ?? ""}`}>{STATUT_LABEL[m.statut] ?? m.statut}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-black">{m.nom} <span className="font-semibold text-zinc-400">· {m.email}</span></p>
                  <p className="mt-0.5 line-clamp-1 text-xs font-medium text-zinc-500">{m.message}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {formatDate(m.createdAt)}{m.boutiqueNom ? ` · Boutique : ${m.boutiqueNom}` : ""}{m.historyCount > 1 ? ` · ${m.historyCount} messages de ce contact` : ""}
                  </p>
                </button>

                {openId === m.id && (
                  <div className="space-y-4 border-t border-zinc-100 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
                    <p className="whitespace-pre-line text-sm font-medium text-zinc-700 dark:text-zinc-200">{m.message}</p>

                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                      <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"><Mail className="h-3.5 w-3.5" />{m.email}</a>
                      {m.telephone && internationalizeNumber(m.telephone) && (
                        <a href={`https://wa.me/${internationalizeNumber(m.telephone)}?text=${encodeURIComponent(`Bonjour ${m.nom}, ici l'équipe GestionPro 👋`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-2.5 py-1.5 text-white"><MessageCircle className="h-3.5 w-3.5" /> Répondre sur WhatsApp</a>
                      )}
                      {m.vendeurId && (
                        <a href="/admin/vendeurs" className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300"><Store className="h-3.5 w-3.5" /> Voir le vendeur{m.boutiqueNom ? ` (${m.boutiqueNom})` : ""}</a>
                      )}
                      <button type="button" onClick={async () => { await setSupportMessageStatut({ messageId: m.id, statut: "ARCHIVE" }); toast.success("Archivé."); router.refresh(); }} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"><Archive className="h-3.5 w-3.5" /> Archiver</button>
                    </div>

                    {m.replies.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Réponses envoyées</p>
                        {m.replies.map((r) => (
                          <div key={r.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                            <p className="whitespace-pre-line text-xs font-medium text-zinc-600 dark:text-zinc-300">{r.body}</p>
                            <p className="mt-1 text-[10px] font-bold text-zinc-400">{formatDate(r.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} maxLength={4000} placeholder={`Répondre à ${m.nom} (envoyé par e-mail)…`} className="rounded-xl bg-white font-medium dark:bg-zinc-900" />
                      <Button onClick={() => sendReply(m)} disabled={busy || reply.trim().length < 2} variant="brand" className="h-10 rounded-xl font-black">
                        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Envoyer la réponse
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setFilter("page", String(page - 1))} className="rounded-xl font-bold"><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-xs font-black text-zinc-500">Page {page} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setFilter("page", String(page + 1))} className="rounded-xl font-bold"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}
