"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Store, User, MessageCircle, Mail, Loader2, Archive, Send, ChevronLeft, ChevronRight, Lightbulb, CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDate } from "@/lib/utils";
import { internationalizeNumber } from "@/lib/whatsapp";
import { MOTIF_LABELS } from "@/schemas/support.schema";
import { replySupportMessage, setSupportMessageStatut } from "@/server/actions/support.actions";

type Msg = {
  id: string; nom: string; email: string; telephone: string | null;
  senderType: string; motif: string; message: string; statut: string;
  /** Était NOUVEAU à l'arrivée sur la page → transition douce vers « lu ». */
  wasNew?: boolean;
  createdAt: string; vendeurId: string | null; boutiqueId: string | null;
  boutiqueNom: string | null; historyCount: number;
  replies: { id: string; body: string; createdAt: string }[];
};

const MOTIF_CHIP: Record<string, string> = {
  SUGGESTION: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  PROBLEME: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400",
  ACCES: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400",
  QUESTION: "border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  INFOS: "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  AUTRE: "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

function relativeDate(iso: string): string {
  const d = new Date(iso);
  return differenceInDays(new Date(), d) > 6
    ? formatDate(iso)
    : formatDistanceToNow(d, { addSuffix: true, locale: fr });
}

/** Initiales stylisées (avatar) — teinte selon le public. */
function Avatar({ nom, senderType }: { nom: string; senderType: string }) {
  const initials = nom.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-black text-white shadow-sm",
        senderType === "VENDEUR"
          ? "bg-gradient-to-br from-blue-500 to-blue-700"
          : "bg-gradient-to-br from-zinc-500 to-zinc-700"
      )}
    >
      {initials}
    </span>
  );
}

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
  // Transition douce « nouveau → lu » : la teinte s'estompe après un instant.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSettled(true), 1800);
    return () => clearTimeout(t);
  }, []);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value); else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
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
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <MessageCircle className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-bold text-zinc-400">Aucun message</p>
            <p className="text-xs font-medium text-zinc-400">Les messages des visiteurs et vendeurs apparaîtront ici.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {messages.map((m) => {
              const isOpen = openId === m.id;
              const freshTint = m.wasNew && !settled;
              return (
                <div
                  key={m.id}
                  className={cn(
                    "transition-colors duration-1000",
                    freshTint && "bg-brand/[0.05] dark:bg-brand/[0.08]"
                  )}
                >
                  {/* ── Carte (liste) ── */}
                  <button
                    type="button"
                    onClick={() => { setOpenId(isOpen ? null : m.id); setReply(""); }}
                    className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  >
                    <div className="relative">
                      <Avatar nom={m.nom} senderType={m.senderType} />
                      {freshTint && (
                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-white transition-opacity duration-1000 dark:ring-zinc-900" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={cn("truncate text-sm", freshTint ? "font-black" : "font-bold")}>{m.nom}</span>
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide",
                          m.senderType === "VENDEUR"
                            ? "border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "border-zinc-300 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                        )}>
                          {m.senderType === "VENDEUR" ? <Store className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
                          {m.senderType === "VENDEUR" ? "Vendeur" : "Visiteur"}
                        </span>
                        <span className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide", MOTIF_CHIP[m.motif] ?? MOTIF_CHIP.AUTRE)}>
                          {m.motif === "SUGGESTION" && <Lightbulb className="h-2.5 w-2.5" />}
                          {MOTIF_LABELS[m.motif] ?? m.motif}
                        </span>
                        <span className="ml-auto shrink-0 text-[10px] font-bold text-zinc-400">{relativeDate(m.createdAt)}</span>
                      </div>
                      <p className={cn("mt-1 line-clamp-2 text-xs leading-relaxed", freshTint ? "font-semibold text-zinc-700 dark:text-zinc-200" : "font-medium text-zinc-500")}>
                        {m.message}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-zinc-400">
                        {m.statut === "REPONDU" && <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400"><CheckCheck className="h-3 w-3" /> Répondu</span>}
                        {m.statut === "ARCHIVE" && <span className="inline-flex items-center gap-0.5"><Archive className="h-3 w-3" /> Archivé</span>}
                        {m.boutiqueNom && <span>Boutique : {m.boutiqueNom}</span>}
                        {m.historyCount > 1 && <span>{m.historyCount} messages de ce contact</span>}
                      </div>
                    </div>
                  </button>

                  {/* ── Détail : fil de conversation ── */}
                  {isOpen && (
                    <div className="space-y-4 border-t border-zinc-100 bg-zinc-50/70 p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950/40">
                      {/* En-tête contact */}
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                        <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 transition-colors hover:border-brand hover:text-brand dark:border-zinc-700 dark:bg-zinc-900">
                          <Mail className="h-3.5 w-3.5" />{m.email}
                        </a>
                        {m.telephone && internationalizeNumber(m.telephone) && (
                          <a href={`https://wa.me/${internationalizeNumber(m.telephone)}?text=${encodeURIComponent(`Bonjour ${m.nom}, ici l'équipe GestionPro 👋`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-2.5 py-1.5 text-white transition-opacity hover:opacity-90">
                            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                          </a>
                        )}
                        {m.vendeurId && (
                          <a href="/admin/vendeurs" className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
                            <Store className="h-3.5 w-3.5" /> Compte vendeur{m.boutiqueNom ? ` · ${m.boutiqueNom}` : ""}
                          </a>
                        )}
                        <span className="ml-auto text-[10px] font-bold text-zinc-400">{formatDate(m.createdAt)}</span>
                      </div>

                      {/* Fil : message reçu (gauche) + réponses envoyées (droite) */}
                      <div className="space-y-3">
                        <div className="flex items-end gap-2">
                          <Avatar nom={m.nom} senderType={m.senderType} />
                          <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-4 py-3 sm:max-w-[75%] dark:border-zinc-700 dark:bg-zinc-900">
                            <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-zinc-800 dark:text-zinc-100">{m.message}</p>
                            <p className="mt-1.5 text-right text-[10px] font-bold text-zinc-400">{relativeDate(m.createdAt)}</p>
                          </div>
                        </div>
                        {m.replies.map((r) => (
                          <div key={r.id} className="flex justify-end">
                            <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-orange-600 to-orange-800 px-4 py-3 text-white shadow-sm sm:max-w-[75%]">
                              <p className="whitespace-pre-line text-sm font-medium leading-relaxed">{r.body}</p>
                              <p className="mt-1.5 flex items-center justify-end gap-1 text-right text-[10px] font-bold text-white/70">
                                <CheckCheck className="h-3 w-3" /> {relativeDate(r.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Zone de réponse + actions */}
                      <div className="space-y-2">
                        <Textarea
                          value={reply} onChange={(e) => setReply(e.target.value)} rows={3} maxLength={4000}
                          placeholder={`Répondre à ${m.nom} (envoyé par e-mail)…`}
                          className="rounded-2xl bg-white font-medium dark:bg-zinc-900"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <Button onClick={() => sendReply(m)} disabled={busy || reply.trim().length < 2} variant="brand" className="h-10 flex-1 rounded-xl font-black sm:flex-none">
                            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi en cours…</> : <><Send className="mr-2 h-4 w-4" /> Envoyer la réponse</>}
                          </Button>
                          {m.statut !== "ARCHIVE" && (
                            <Button
                              variant="outline" className="h-10 rounded-xl font-bold text-zinc-500"
                              onClick={async () => { await setSupportMessageStatut({ messageId: m.id, statut: "ARCHIVE" }); toast.success("Message archivé."); router.refresh(); }}
                            >
                              <Archive className="mr-2 h-4 w-4" /> Archiver
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setFilter("page", String(page - 1))} className="rounded-xl font-bold" aria-label="Page précédente"><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-xs font-black text-zinc-500">Page {page} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setFilter("page", String(page + 1))} className="rounded-xl font-bold" aria-label="Page suivante"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}
