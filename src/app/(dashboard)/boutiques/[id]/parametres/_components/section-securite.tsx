"use client";

import React, { useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { LogOut, ShieldCheck, Activity, Loader2, Smartphone, Globe2, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { terminateAllOtherSessions } from "@/server/actions/user.actions";

interface ActivityEntry {
  id: string;
  action: string;
  subjectType: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date | string;
}

interface Props {
  initial: {
    accountCreatedAt: Date | string;
    lastUpdatedAt: Date | string;
    activity: ActivityEntry[];
  };
}

function parseUA(ua: string | null): { device: string; browser: string } {
  if (!ua) return { device: "Inconnu", browser: "" };
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  let browser = "Navigateur";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "Safari";
  return { device: isMobile ? "Mobile" : "Bureau", browser };
}

function formatAction(action: string): string {
  const map: Record<string, string> = {
    BOUTIQUE_CREATED: "Création boutique",
    BOUTIQUE_UPDATED: "Modification boutique",
    BOUTIQUE_DELETED: "Désactivation boutique",
    BOUTIQUE_REACTIVATED: "Réactivation boutique",
    BOUTIQUE_PERMANENTLY_DELETED: "Suppression définitive boutique",
    USER_ACCOUNT_DELETED: "Suppression compte",
    MEMBRE_INVITED: "Invitation membre",
    PRODUIT_CREATED: "Création produit",
    PRODUIT_UPDATED: "Modification produit",
    CLIENT_CREATED: "Nouveau client",
    COMMANDE_CREATED: "Nouvelle commande",
  };
  return map[action] || action.replaceAll("_", " ").toLowerCase();
}

export function SectionSecurite({ initial }: Props) {
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOutAll() {
    if (!confirm("Déconnecter tous les autres appareils ? Vous resterez connecté sur celui-ci.")) {
      return;
    }
    setLoading(true);
    try {
      const result = await terminateAllOtherSessions();
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success("Autres sessions terminées");
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOutThis() {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  const lastLogin = initial.activity[0];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-brand" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Dernière activité</span>
          </div>
          <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">
            {lastLogin
              ? new Date(lastLogin.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Aucune activité"}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Compte créé le</span>
          </div>
          <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">
            {new Date(initial.accountCreatedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
          <Activity className="h-3 w-3" /> Historique récent
        </h3>
        {initial.activity.length === 0 ? (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
            <Info className="h-4 w-4 text-zinc-400 mt-0.5" />
            <p className="text-xs font-medium text-zinc-500">Aucune activité enregistrée pour ce compte pour le moment.</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 overflow-hidden">
            {initial.activity.map((entry) => {
              const { device, browser } = parseUA(entry.userAgent);
              return (
                <li key={entry.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="h-9 w-9 rounded-xl bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center shrink-0">
                    <Smartphone className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate">{formatAction(entry.action)}</p>
                    <p className="text-[10px] font-medium text-zinc-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <Globe2 className="h-3 w-3 shrink-0" />
                      <span className="truncate">{entry.ipAddress || "IP inconnue"}</span>
                      <span className="text-zinc-300">•</span>
                      <span className="truncate">{device} · {browser}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 shrink-0">
                    {new Date(entry.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          onClick={handleSignOutAll}
          disabled={loading}
          variant="outline"
          className="h-12 rounded-xl font-bold text-xs border-zinc-200 dark:border-zinc-800"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
          Déconnecter les autres appareils
        </Button>
        <Button
          type="button"
          onClick={handleSignOutThis}
          disabled={signingOut}
          variant="outline"
          className="h-12 rounded-xl font-bold text-xs border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/30 dark:hover:bg-rose-950/20"
        >
          {signingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
          Se déconnecter ici
        </Button>
      </div>
    </div>
  );
}
