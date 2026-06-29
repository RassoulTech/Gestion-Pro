"use client";

import { useEffect, useState } from "react";
import { Download, Share, Plus, X, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/** Événement non encore typé dans lib.dom (Android / Chromium desktop). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "gp-pwa-install-dismissed";
const DISMISS_DAYS = 14;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return window.matchMedia?.("(display-mode: standalone)").matches || iosStandalone;
}

function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const iOSDevice =
    /iphone|ipad|ipod/.test(ua) ||
    // iPadOS 13+ se présente comme un Mac tactile.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  // L'invite native n'existe que sur Safari (pas Chrome/Firefox iOS = même moteur mais pas d'A2HS direct).
  const isSafari = /safari/.test(ua) && !/crios|fxios|edgios/.test(ua);
  return iOSDevice && isSafari;
}

function recentlyDismissed(): boolean {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY));
    return Boolean(ts) && Date.now() - ts < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

/**
 * Invite d'installation PWA multi-plateforme (mobile-first).
 * - Android / desktop Chromium : capte `beforeinstallprompt` → bouton « Installer »
 *   déclenchant l'invite native.
 * - iPhone / iPad (pas d'invite native) : instructions « Partager → écran d'accueil ».
 * - Ne s'affiche pas si l'app tourne déjà en mode installé (standalone) ni si
 *   l'utilisateur a refusé récemment (mémorisé en localStorage).
 */
export function InstallPrompt() {
  const t = useTranslations("pwa");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // on garde la main pour afficher notre bannière
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
      setVisible(false);
      setIosOpen(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIosSafari()) {
      setIos(true);
      // Laisse l'app s'afficher avant de proposer l'installation.
      iosTimer = setTimeout(() => setVisible(true), 1500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
    setIosOpen(false);
  }

  async function handleInstall() {
    if (ios) {
      setIosOpen(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice.catch(() => null);
    setDeferred(null);
    setVisible(false);
    if (choice?.outcome !== "accepted") dismiss();
  }

  if (!visible) return null;

  const iosSteps = [
    { icon: Share, text: t("iosStep1") },
    { icon: Plus, text: t("iosStep2") },
    { icon: Download, text: t("iosStep3") },
  ];

  return (
    <>
      {/* Bannière (mobile : pleine largeur en bas ; desktop : carte en bas à droite) */}
      <div className="fixed inset-x-0 bottom-0 z-[60] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] duration-300 animate-in fade-in slide-in-from-bottom-4 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[26rem] sm:p-0">
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/95 p-3 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-card/80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/192" alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-foreground">{t("title")}</p>
            <p className="truncate text-xs font-medium text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Button onClick={handleInstall} variant="brand" className="h-9 shrink-0 rounded-xl px-3 font-bold">
            <Download className="mr-1.5 h-4 w-4" />
            {t("install")}
          </Button>
          <button
            onClick={dismiss}
            aria-label={t("close")}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-foreground/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Feuille d'instructions iOS */}
      {iosOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-3 animate-in fade-in sm:items-center"
          onClick={() => setIosOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-border/60 bg-card p-5 shadow-2xl duration-300 animate-in slide-in-from-bottom-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-brand" />
              <h2 className="text-base font-black text-foreground">{t("iosTitle")}</h2>
            </div>
            <p className="mb-4 text-xs font-semibold text-muted-foreground">{t("iosIntro")}</p>
            <ol className="space-y-3">
              {iosSteps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <li key={i} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-sm font-black text-brand">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-bold text-foreground">{s.text}</span>
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </li>
                );
              })}
            </ol>
            <Button onClick={dismiss} variant="brand" className="mt-5 h-11 w-full rounded-xl font-black">
              {t("iosGotIt")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
