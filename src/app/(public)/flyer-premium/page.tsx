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
  TrendingUp,
  Store,
  Layers,
  Receipt,
  WifiOff,
  ShoppingCart,
} from "lucide-react";
import {
  WhatsAppIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
} from "@/components/icons/brand-icons";
import QRCode from "qrcode";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";

/**
 * Flyer "Premium" — fond navy sombre + accent orange unique, inspiré des
 * flyers SaaS premium (gros titre, badge services, liste de fonctionnalités,
 * mockup téléphone avec cartes flottantes, barre de contact + réseaux).
 *
 * 100 % HTML/CSS (aucun gros SVG inline), QR généré en local (data URL),
 * export PNG fiable via html-to-image. Build webpack sain.
 */
export default function FlyerPremiumPage() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://gestion-pro.vercel.app";
  const displayUrl = appUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const [qrDataUrl, setQrDataUrl] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(appUrl, {
      width: 250,
      margin: 1,
      color: { dark: "#0a1326", light: "#ffffff" },
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
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#0a1326",
        filter: (el) =>
          !(el instanceof HTMLElement && el.classList?.contains("no-print")),
      });
      const link = document.createElement("a");
      link.download = "flyer-premium-gestionpro.png";
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

  const services = [
    { icon: Store, label: "Multi-boutiques pilotées en temps réel" },
    { icon: Layers, label: "Stock & alertes de rupture automatiques" },
    { icon: Receipt, label: "Facturation + reçus par WhatsApp" },
    { icon: WifiOff, label: "Mode hors-ligne intégré" },
    { icon: ShoppingCart, label: "Marketplace pour vendre en ligne" },
  ];

  const socials = [FacebookIcon, InstagramIcon, LinkedInIcon, WhatsAppIcon];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center py-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Decorative blobs (screen only) */}
      <div className="absolute top-1/4 left-1/12 w-96 h-96 bg-orange-600/10 blur-[150px] rounded-full pointer-events-none no-print" />
      <div className="absolute bottom-1/4 right-1/12 w-96 h-96 bg-blue-600/10 blur-[150px] rounded-full pointer-events-none no-print" />

      {/* ── ACTION BAR (no print) ─────────────────────────────────────────── */}
      <div className="w-full max-w-[210mm] mb-8 bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl z-20 no-print">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-all"
            aria-label="Retour à l'accueil"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <span className="text-orange-500 font-extrabold uppercase text-[10px] tracking-widest px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                Premium
              </span>
              Flyer Services
            </h1>
            <p className="text-xs text-zinc-500">Format A4 · Téléchargeable en PNG</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex h-10 items-center gap-2 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm font-bold text-zinc-200 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
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
        className="w-full max-w-[210mm] min-h-[297mm] bg-gradient-to-br from-[#0a1326] via-[#0d1b38] to-[#070d1c] text-white shadow-2xl relative flex flex-col overflow-hidden select-none"
        style={{ aspectRatio: "1 / 1.4142" }}
      >
        {/* Tech grid + ambient glow (captured in the PNG) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:38px_38px] [mask-image:radial-gradient(ellipse_80%_60%_at_70%_30%,#000_55%,transparent_100%)] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] bg-orange-600/25 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 -left-24 w-[360px] h-[360px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col p-8 sm:p-12">
          {/* Top bar : logo + site */}
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <BrandLogo size={40} rounded={10} className="shadow-lg shadow-orange-600/20" />
              <span className="text-xl font-black tracking-tight">
                Gestion<span className="text-orange-500">Pro</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-300">
              <Globe className="h-4 w-4 text-orange-500" />
              <span>{displayUrl}</span>
            </div>
          </div>

          {/* Main : texte (gauche) + mockup (droite) */}
          <div className="mt-8 grid flex-1 grid-cols-1 items-center gap-8 md:grid-cols-12">
            {/* Left column */}
            <div className="md:col-span-7 space-y-6">
              <h2 className="text-4xl sm:text-5xl font-black leading-[1.05] tracking-tight">
                Gérez votre
                <br />
                commerce
                <br />
                <span className="text-orange-500">comme un Pro</span>
              </h2>

              <p className="text-zinc-300/90 text-sm sm:text-base leading-relaxed max-w-md">
                Stock, ventes, clients, facturation et marketplace — une seule
                application, rapide et fiable, pensée pour les commerçants
                d&apos;Afrique de l&apos;Ouest.
              </p>

              <div>
                <span className="inline-block rounded-full bg-orange-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-600/30">
                  Nos fonctionnalités
                </span>
              </div>

              <ul className="space-y-3.5">
                {services.map((s) => {
                  const Icon = s.icon;
                  return (
                    <li key={s.label} className="flex items-center gap-3.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-orange-400">
                        <Icon className="h-4 w-4" strokeWidth={2.4} />
                      </span>
                      <span className="text-sm sm:text-[15px] font-semibold text-zinc-100">
                        {s.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Right column : phone + floating cards */}
            <div className="md:col-span-5 relative flex items-center justify-center min-h-[440px]">
              <div className="absolute inset-0 m-auto h-56 w-56 rounded-full bg-orange-500/25 blur-[80px]" />

              {/* Phone */}
              <div className="relative h-[420px] w-[210px] rotate-3 rounded-[38px] border-4 border-zinc-800/80 bg-zinc-900 p-2.5 shadow-2xl">
                <div className="absolute left-1/2 top-4 z-20 h-4 w-20 -translate-x-1/2 rounded-full bg-zinc-900" />
                <div className="flex h-full w-full flex-col overflow-hidden rounded-[30px] bg-zinc-50 p-3 pt-6 text-zinc-900">
                  {/* phone header */}
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <BrandLogo size={18} rounded={4} />
                      <span className="text-[9px] font-black tracking-tighter">
                        Gestion<span className="text-orange-600">Pro</span>
                      </span>
                    </div>
                    <span className="text-[7px] font-bold text-zinc-400">Boutique Dakar</span>
                  </div>

                  {/* stat card */}
                  <div className="my-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-3 text-white shadow-sm">
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

                  {/* mini graph */}
                  <div className="flex flex-1 flex-col justify-between rounded-xl bg-zinc-100 p-2">
                    <span className="text-[7px] font-bold text-zinc-500">Croissance</span>
                    <div className="flex h-12 items-end gap-1.5 px-1 pb-1">
                      <div className="h-5 w-full rounded-t bg-orange-600/30" />
                      <div className="h-7 w-full rounded-t bg-orange-600/40" />
                      <div className="h-9 w-full rounded-t bg-orange-600/60" />
                      <div className="h-14 w-full rounded-t bg-orange-600/80" />
                      <div className="h-20 w-full rounded-t bg-orange-600" />
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-2 text-[7px] font-bold text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Package className="h-2.5 w-2.5" /> 12 Articles
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-2.5 w-2.5" /> +12.4%
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating card — bénéfice (top-left) */}
              <div className="absolute -left-1 top-4 flex -rotate-6 items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-xl shadow-black/30">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <div className="leading-none">
                  <p className="text-[8px] font-bold text-zinc-400">Bénéfice</p>
                  <p className="text-[11px] font-black text-zinc-900">+48 000 F</p>
                </div>
              </div>

              {/* Floating card — commande (bottom-right) */}
              <div className="absolute -right-1 bottom-20 flex rotate-6 items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-xl shadow-black/30">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                  <ShoppingCart className="h-4 w-4" />
                </span>
                <div className="leading-none">
                  <p className="text-[8px] font-bold text-zinc-400">Nouvelle</p>
                  <p className="text-[11px] font-black text-zinc-900">Commande</p>
                </div>
              </div>

              {/* Floating card — QR (bottom-left) */}
              <div className="absolute -bottom-1 left-1 flex -rotate-3 items-center gap-1.5 rounded-2xl bg-white p-1.5 shadow-xl shadow-black/30">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR GestionPro"
                    className="h-10 w-10 rounded object-contain"
                  />
                ) : (
                  <div className="h-10 w-10 animate-pulse rounded bg-zinc-100" />
                )}
                <span className="pr-1 text-[7px] font-black uppercase leading-tight tracking-wide text-zinc-700">
                  Scannez
                  <br />
                  pour
                  <br />
                  essayer
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer bar (div, pas <footer> → conservé à l'impression) */}
        <div className="relative z-10 flex items-center justify-between gap-4 bg-gradient-to-r from-orange-700 via-orange-600 to-amber-600 px-8 py-5 sm:px-12">
          <div className="space-y-1.5 text-white">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <Phone className="h-4 w-4 shrink-0" />
              <span>+221 77 383 13 64</span>
            </div>
            <a
              href="mailto:dionemhd1@gmail.com"
              className="flex items-center gap-2 text-xs sm:text-sm font-bold"
            >
              <Mail className="h-4 w-4 shrink-0" />
              <span>dionemhd1@gmail.com</span>
            </a>
          </div>
          <div className="flex items-center gap-2">
            {socials.map((Icon, i) => (
              <span
                key={i}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        {/* Test badge (screen only) */}
        <div className="relative z-10 bg-orange-600 py-2 text-center no-print">
          <span className="text-[9px] font-black uppercase tracking-widest text-black">
            Version de test privé
          </span>
        </div>
      </div>

      {/* ── PRINT STYLES ──────────────────────────────────────────────────── */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 0 !important;
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
            background: #0a1326 !important;
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
