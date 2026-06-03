"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Printer,
  Download,
  ArrowLeft,
  Loader2,
  Globe,
  Phone,
  Mail,
  Package,
  Layers,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  Store,
  QrCode,
  Check,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/brand-icons";
import QRCode from "qrcode";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";

/**
 * Flyer OFFICIEL de la plateforme GestionPro.
 *
 * Objectif : présenter la solution (web) aux commerçants / PME / entrepreneurs
 * et acquérir de nouveaux utilisateurs (distribution marchés, boutiques, démos).
 *
 * Règles : branding officiel uniquement (logo réel, orange #ea580c, blanc, gris),
 * AUCUN bleu/violet, communication honnête (app web — pas de store mobile),
 * uniquement des fonctionnalités réellement développées (vérifiées dans le code).
 * Imprimable A4/A5, photocopiable, export PDF (impression) + PNG HD.
 */
export default function FlyerPremiumPage() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://gestion-pro-rassoultechs-projects.vercel.app";
  const displayUrl = appUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const phone = "+221 77 383 13 64";
  const phoneIntl = "221773831364";
  const email = "dionemhd1@gmail.com";

  const [qrDataUrl, setQrDataUrl] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(appUrl, {
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
  }, [appUrl]);

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

  // Fonctionnalités RÉELLEMENT développées (vérifiées dans le code).
  const features = [
    { icon: Package, label: "Produits", desc: "Catalogue & prix" },
    { icon: Layers, label: "Stock", desc: "Alertes de rupture" },
    { icon: ShoppingCart, label: "Commandes", desc: "Ventes & suivi" },
    { icon: Users, label: "Clients", desc: "Historique & dettes" },
    { icon: Truck, label: "Fournisseurs", desc: "Achats & livraisons" },
    { icon: BarChart3, label: "Rapports PDF", desc: "Performances claires" },
    { icon: Store, label: "Marketplace", desc: "Vendez en ligne" },
    { icon: QrCode, label: "QR Code boutique", desc: "Vitrine partageable" },
  ];

  const trust = ["100 % en ligne", "Sur mobile & ordinateur", "Wave · Orange Money · Carte"];

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
        {/* Bande d'accent orange en haut */}
        <div className="h-2 w-full bg-orange-600 shrink-0" />

        <div className="flex flex-1 flex-col p-8 sm:p-12">
          {/* ── En-tête : logo + site ── */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <BrandLogo size={42} rounded={10} className="shadow-sm" />
              <span className="text-2xl font-black tracking-tight text-slate-900">
                Gestion<span className="text-orange-600">Pro</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <Globe className="h-4 w-4 text-orange-600" />
              <span>{displayUrl}</span>
            </div>
          </div>

          {/* ── Titre principal ── */}
          <div className="mt-8 space-y-4">
            <span className="inline-block rounded-full bg-orange-50 border border-orange-100 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-orange-600">
              Solution de gestion commerciale
            </span>
            <h2 className="text-4xl sm:text-5xl font-black leading-[1.05] tracking-tight text-slate-950">
              Gérez votre commerce<br />
              <span className="text-orange-600">simplement</span>
            </h2>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl">
              La solution moderne et tout-en-un pour piloter votre activité —
              ventes, stock, clients et plus — directement depuis votre navigateur.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {trust.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700"
                >
                  <Check className="h-3.5 w-3.5 text-orange-600" strokeWidth={3} />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* ── Fonctionnalités + mockup ── */}
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-12 items-center">
            {/* Grille de fonctionnalités (réelles) */}
            <div className="md:col-span-7">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                Tout ce dont vous avez besoin
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.label}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                        <Icon className="h-4 w-4" strokeWidth={2.4} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-slate-900 leading-none">
                          {f.label}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500 mt-0.5 truncate">
                          {f.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mockup propre (clair) */}
            <div className="md:col-span-5 flex items-center justify-center">
              <div className="relative h-[400px] w-[200px] rounded-[38px] border-4 border-slate-800 bg-slate-900 p-2.5 shadow-2xl">
                <div className="absolute left-1/2 top-4 z-20 h-4 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
                <div className="flex h-full w-full flex-col overflow-hidden rounded-[30px] bg-white p-3 pt-6 text-slate-900 border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <BrandLogo size={18} rounded={4} />
                      <span className="text-[9px] font-black tracking-tighter">
                        Gestion<span className="text-orange-600">Pro</span>
                      </span>
                    </div>
                    <span className="text-[7px] font-bold text-slate-400">Tableau de bord</span>
                  </div>

                  <div className="my-2 rounded-xl bg-orange-600 p-3 text-white">
                    <span className="text-[7px] font-semibold uppercase tracking-wider opacity-80">
                      Ventes du jour
                    </span>
                    <h5 className="my-1 text-base font-black leading-none tracking-tight">
                      145 000 F
                    </h5>
                    <div className="flex items-center justify-between text-[7px]">
                      <span>Bénéfice net</span>
                      <span className="rounded bg-white/20 px-1.5 py-0.5 font-extrabold">
                        +48 000 F
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between rounded-xl bg-slate-50 border border-slate-100 p-2">
                    <span className="text-[7px] font-bold text-slate-500">Croissance</span>
                    <div className="flex h-12 items-end gap-1.5 px-1 pb-1">
                      <div className="h-5 w-full rounded-t bg-orange-600/30" />
                      <div className="h-7 w-full rounded-t bg-orange-600/45" />
                      <div className="h-9 w-full rounded-t bg-orange-600/60" />
                      <div className="h-14 w-full rounded-t bg-orange-600/80" />
                      <div className="h-20 w-full rounded-t bg-orange-600" />
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[7px] font-bold text-slate-400">
                    <span className="flex items-center gap-1">
                      <Package className="h-2.5 w-2.5" /> 12 Articles
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-2.5 w-2.5" /> Rapports
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bloc QR (très visible) ── */}
          <div className="mt-8 flex items-center gap-5 rounded-3xl bg-orange-600 p-5 sm:p-6 text-white">
            <div className="shrink-0 rounded-2xl bg-white p-2.5 shadow-lg">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR code vers GestionPro"
                  className="h-28 w-28 sm:h-32 sm:w-32 object-contain"
                />
              ) : (
                <div className="h-28 w-28 sm:h-32 sm:w-32 animate-pulse rounded bg-slate-100" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-widest text-orange-100">
                Scannez pour découvrir
              </p>
              <p className="text-2xl sm:text-3xl font-black leading-tight mt-1">
                Essayez gratuitement
              </p>
              <p className="text-sm font-semibold text-orange-50/90 mt-1">
                Aucune installation — ouvrez directement dans votre navigateur.
              </p>
              <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                <Globe className="h-3.5 w-3.5" />
                {displayUrl}
              </p>
            </div>
          </div>
        </div>

        {/* ── Pied de page : contact (div, conservé à l'impression) ── */}
        <div className="border-t border-slate-100 px-8 sm:px-12 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-slate-700">
            <a href={`tel:${phoneIntl}`} className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                <Phone className="h-4 w-4" />
              </span>
              {phone}
            </a>
            <a
              href={`https://wa.me/${phoneIntl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-sm">
                <WhatsAppIcon className="h-4 w-4" />
              </span>
              WhatsApp
            </a>
            <a href={`mailto:${email}`} className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                <Mail className="h-4 w-4" />
              </span>
              {email}
            </a>
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900 shrink-0">
            Gestion<span className="text-orange-600">Pro</span>
          </span>
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
