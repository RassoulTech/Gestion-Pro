"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Printer,
  Download,
  ArrowLeft,
  Loader2,
  Phone,
  Mail,
  Package,
  ShoppingCart,
  BarChart3,
  LayoutDashboard,
  TrendingUp,
  Check,
} from "lucide-react";
import {
  WhatsAppIcon,
  WaveIcon,
  OrangeMoneyIcon,
} from "@/components/icons/brand-icons";
import QRCode from "qrcode";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
import { getAdminWhatsAppLink } from "@/lib/whatsapp";
import { env } from "@/env.mjs";

/**
 * Flyer OFFICIEL de la plateforme GestionPro — support commercial SaaS.
 *
 * Objectif de conversion : amener le commerçant à DEMANDER une démonstration
 * privée (le projet est en phase de lancement, accès sur demande) — pas à
 * entrer directement dans l'application.
 *
 * Branding strict : logo réel, orange #ea580c, blanc, gris. Aucun bleu/violet.
 * Communication honnête (app web, pas de store mobile) — uniquement des
 * fonctionnalités/paiements réellement développés (vérifiés dans le code).
 * Imprimable A4/A5, photocopiable, PDF (impression) + PNG HD.
 */
export default function FlyerPremiumPage() {
  const adminPhone = env.NEXT_PUBLIC_WHATSAPP_ADMIN_NUMBER || "221773831364";
  const phone = env.NEXT_PUBLIC_WHATSAPP_ADMIN_NUMBER ? `+${env.NEXT_PUBLIC_WHATSAPP_ADMIN_NUMBER}` : "+221 77 383 13 64";
  const phoneIntl = adminPhone;
  const email = "dionemhd1@gmail.com";
  const waLink = getAdminWhatsAppLink();

  const [qrDataUrl, setQrDataUrl] = useState("");
  const [downloading, setDownloading] = useState(false);

  // Le QR mène vers une demande de démo sur WhatsApp (pas vers l'application).
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(waLink, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [waLink]);

  async function handleDownloadPng() {
    const node = document.getElementById("flyer-canvas");
    if (!node) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, {
        pixelRatio: 2.5,
        cacheBust: true,
        backgroundColor: "#ffffff",
        filter: (el) =>
          !(el instanceof HTMLElement && el.classList?.contains("no-print")),
      });
      const link = document.createElement("a");
      link.download = "flyer-gestionpro.png";
      link.href = dataUrl;
      link.click();
      toast.success("Flyer PNG téléchargé !");
    } catch (e) {
      console.error("[flyer-premium] PNG export failed:", e);
      toast.error("Échec du téléchargement PNG.");
    } finally {
      setDownloading(false);
    }
  }

  // Bénéfices RÉELS (chaque ligne correspond à une fonctionnalité développée).
  const benefits = [
    "Suivez vos ventes en temps réel",
    "Gérez votre stock facilement, avec alertes de rupture",
    "Gardez l'historique de vos clients et leurs dettes",
    "Suivez vos fournisseurs et vos achats",
    "Générez des rapports & factures PDF professionnels",
    "Vendez aussi en ligne grâce à la marketplace",
    "Partagez votre boutique avec un QR Code",
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 flex flex-col items-center py-8 px-4 sm:px-6 relative">
      {/* ── ACTION BAR (no print) ─────────────────────────────────────────── */}
      <div className="w-full max-w-[210mm] mb-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg z-20 no-print">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 transition-all"
            aria-label="Retour à l'accueil"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <span className="text-orange-600 font-extrabold uppercase text-[10px] tracking-widest px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20">
                Officiel
              </span>
              Flyer plateforme
            </h1>
            <p className="text-xs text-slate-500">A4 / A5 · Imprimable · PNG HD</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex h-10 items-center gap-2 px-4 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-sm font-bold text-slate-700 dark:text-zinc-200 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimer / PDF</span>
          </button>
          <button
            onClick={handleDownloadPng}
            disabled={downloading}
            className="inline-flex h-10 items-center gap-2 px-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-sm font-bold text-white transition-all shadow-md active:scale-95 shadow-orange-600/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span>{downloading ? "Génération…" : "Télécharger PNG"}</span>
          </button>
        </div>
      </div>

      {/* ── FLYER CANVAS (A4 portrait) ────────────────────────────────────── */}
      <div
        id="flyer-canvas"
        className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl relative flex flex-col overflow-hidden select-none"
        style={{ aspectRatio: "1 / 1.4142" }}
      >
        <div className="h-2 w-full bg-orange-600 shrink-0" />

        <div className="flex flex-1 flex-col p-8 sm:p-10">
          {/* ── En-tête ── */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <BrandLogo size={38} rounded={9} className="shadow-sm" />
              <span className="text-2xl font-black tracking-tight text-slate-900">
                Gestion<span className="text-orange-600">Pro</span>
              </span>
            </div>
            <div className="hidden sm:block text-xs font-black uppercase tracking-widest text-slate-400">
              Commerçants · Boutiques · PME
            </div>
          </div>

          {/* ── Titre ── */}
          <div className="mt-6 space-y-3">
            <span className="inline-block rounded-full bg-orange-50 border border-orange-100 px-3.5 py-1 text-[11px] font-black uppercase tracking-widest text-orange-600">
              Solution de gestion commerciale
            </span>
            <h2 className="text-4xl sm:text-[2.9rem] font-black leading-[1.04] tracking-tight text-slate-950">
              Gérez votre commerce<br />
              <span className="text-orange-600">simplement</span>
            </h2>
            <p className="text-slate-600 text-base leading-relaxed max-w-xl">
              La solution moderne et tout-en-un pour piloter votre activité au
              quotidien — accessible depuis votre navigateur, sur mobile comme
              sur ordinateur.
            </p>
          </div>

          {/* ── Bénéfices + mockup ── */}
          <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-12 items-start">
            {/* Bénéfices (valeur, pas seulement des fonctions) */}
            <div className="md:col-span-7">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                Ce que GestionPro vous apporte
              </h3>
              <ul className="space-y-2.5">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-600 text-white">
                      <Check className="h-3 w-3" strokeWidth={4} />
                    </span>
                    <span className="text-[15px] font-semibold text-slate-800 leading-snug">
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mockup téléphone premium & réaliste */}
            <div className="md:col-span-5 flex items-start justify-center">
              <div className="relative h-[372px] w-[184px] rounded-[34px] border-[5px] border-slate-900 bg-slate-900 shadow-2xl">
                {/* Dynamic island */}
                <div className="absolute left-1/2 top-2 z-20 h-3.5 w-16 -translate-x-1/2 rounded-full bg-black" />
                <div className="flex h-full w-full flex-col overflow-hidden rounded-[28px] bg-slate-50 text-slate-900">
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-3 pt-2 pb-1 text-[7px] font-bold text-slate-500">
                    <span>14:32</span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <span>100%</span>
                    </span>
                  </div>

                  {/* App header */}
                  <div className="flex items-center justify-between border-b border-slate-100 bg-white px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <BrandLogo size={16} rounded={4} />
                      <span className="text-[9px] font-black tracking-tighter">
                        Ma Boutique
                      </span>
                    </div>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-[7px] font-black text-orange-600">
                      MD
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-2.5">
                    {/* KPI principal */}
                    <div className="rounded-2xl bg-orange-600 p-3 text-white shadow-sm">
                      <span className="text-[7px] font-semibold uppercase tracking-wider opacity-80">
                        Ventes du jour
                      </span>
                      <h5 className="my-0.5 text-lg font-black leading-none tracking-tight">
                        145 000 FCFA
                      </h5>
                      <span className="inline-flex items-center gap-1 text-[7px] font-bold">
                        <TrendingUp className="h-2.5 w-2.5" /> +12 % vs hier
                      </span>
                    </div>

                    {/* Deux tuiles */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-slate-100 bg-white p-2">
                        <p className="text-[6.5px] font-bold uppercase tracking-wide text-slate-400">
                          Bénéfice net
                        </p>
                        <p className="text-[11px] font-black text-slate-900">48 000 F</p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-white p-2">
                        <p className="text-[6.5px] font-bold uppercase tracking-wide text-slate-400">
                          Commandes
                        </p>
                        <p className="text-[11px] font-black text-slate-900">23</p>
                      </div>
                    </div>

                    {/* Mini graphe */}
                    <div className="rounded-xl border border-slate-100 bg-white p-2">
                      <p className="text-[6.5px] font-bold text-slate-500">
                        7 derniers jours
                      </p>
                      <div className="mt-1 flex h-9 items-end gap-1">
                        {[40, 55, 45, 70, 60, 85, 100].map((h, i) => (
                          <div
                            key={i}
                            className="w-full rounded-t bg-orange-500"
                            style={{ height: `${h}%`, opacity: 0.45 + (h / 100) * 0.55 }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Dernières ventes */}
                    <div className="rounded-xl border border-slate-100 bg-white p-2">
                      <p className="mb-1 text-[6.5px] font-bold text-slate-500">
                        Dernières ventes
                      </p>
                      <div className="flex items-center justify-between text-[7px]">
                        <span className="font-semibold text-slate-700">Café Touba ×3</span>
                        <span className="font-black text-slate-900">4 500 F</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[7px]">
                        <span className="font-semibold text-slate-700">Savon de Marseille</span>
                        <span className="font-black text-slate-900">2 500 F</span>
                      </div>
                    </div>
                  </div>

                  {/* Barre d'onglets */}
                  <div className="flex items-center justify-around border-t border-slate-100 bg-white py-1.5">
                    <LayoutDashboard className="h-3.5 w-3.5 text-orange-600" />
                    <Package className="h-3.5 w-3.5 text-slate-300" />
                    <ShoppingCart className="h-3.5 w-3.5 text-slate-300" />
                    <BarChart3 className="h-3.5 w-3.5 text-slate-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Moyens de paiement ── */}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-slate-100 bg-slate-50/60 px-5 py-3">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Paiement Mobile Money
            </span>
            <div className="flex items-center gap-3">
              <WaveIcon className="h-9 w-9 rounded-lg" />
              <OrangeMoneyIcon className="h-9 w-9 rounded-lg" />
            </div>
          </div>

          {/* ── CTA Démonstration (QR → WhatsApp) ── */}
          <div className="mt-6 flex items-center gap-5 rounded-3xl bg-orange-600 p-5 text-white">
            <div className="shrink-0 rounded-2xl bg-white p-2.5 shadow-lg">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR code — demander une démonstration"
                  className="h-28 w-28 object-contain"
                />
              ) : (
                <div className="h-28 w-28 animate-pulse rounded bg-slate-100" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-widest text-orange-100">
                Découvrez comment digitaliser votre commerce
              </p>
              <p className="text-2xl font-black leading-tight mt-1">
                Demandez votre démonstration privée
              </p>
              <p className="text-sm font-semibold text-orange-50/90 mt-1">
                Scannez le QR code et échangeons directement sur WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* ── Pied de page : contact (div → conservé à l'impression) ── */}
        <div className="border-t border-slate-100 px-8 sm:px-10 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-sm">
                <WhatsAppIcon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  WhatsApp
                </span>
                <span className="block text-[13px] font-black text-slate-900 truncate">
                  {phone}
                </span>
              </span>
            </a>

            <a href={`tel:${phoneIntl}`} className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                <Phone className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Téléphone
                </span>
                <span className="block text-[13px] font-black text-slate-900 truncate">
                  {phone}
                </span>
              </span>
            </a>

            <a href={`mailto:${email}`} className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                <Mail className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Email
                </span>
                <span className="block text-[13px] font-black text-slate-900 truncate">
                  {email}
                </span>
              </span>
            </a>

          </div>
        </div>
      </div>

      {/* ── PRINT STYLES ──────────────────────────────────────────────────── */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          nav,
          footer,
          .no-print,
          header,
          #floating-navbar-container {
            display: none !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            opacity: 0 !important;
            visibility: hidden !important;
          }
          html,
          body {
            background: #ffffff !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #flyer-canvas {
            width: 210mm !important;
            height: 297mm !important;
            max-width: 210mm !important;
            min-height: 297mm !important;
            border: none !important;
            box-shadow: none !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            margin: 0 !important;
            page-break-inside: avoid !important;
            overflow: hidden !important;
          }
        }
      `}</style>
    </div>
  );
}
