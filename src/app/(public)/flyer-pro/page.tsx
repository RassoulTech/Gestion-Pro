"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Printer,
  Download,
  ArrowLeft,
  Package,
  Receipt,
  TrendingUp,
  Users,
  WifiOff,
  Check,
  Globe,
  Mail,
  Sparkles,
  Loader2,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/icons/brand-icons";
import { BrandLogo } from "@/components/brand-logo";

/**
 * Flyer commercial "Pro" — version premium inspirée du modèle BrandPacks,
 * adaptée à l'identité GestionPro (orange #ea580c).
 *
 * Construit sur le squelette éprouvé du flyer officiel (rendu 100 % HTML/CSS,
 * mockup en divs, styled-jsx STATIQUE, impression vectorielle navigateur).
 * Aucun gros SVG inline ni styled-jsx dynamique → build webpack sain (~75 s).
 */
export default function FlyerProPage() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://gestion-pro.vercel.app";
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [downloading, setDownloading] = useState(false);

  // QR généré localement (data URL) — pas de dépendance externe, export PNG fiable.
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(appUrl, { width: 250, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } })
      .then((url) => { if (active) setQrDataUrl(url); })
      .catch(() => {});
    return () => { active = false; };
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
        backgroundColor: "#ffffff",
        filter: (el) => !(el instanceof HTMLElement && el.classList?.contains("no-print")),
      });
      const link = document.createElement("a");
      link.download = "flyer-pro-gestionpro.png";
      link.href = dataUrl;
      link.click();
      toast.success("Flyer PNG téléchargé !");
    } catch (e) {
      console.error("[flyer-pro] PNG export failed:", e);
      toast.error("Échec du téléchargement PNG.");
    } finally {
      setDownloading(false);
    }
  }

  const benefits = [
    "Suivez vos ventes et bénéfices en temps réel",
    "Maîtrisez stocks, marges et dépenses",
    "Fonctionne même sans connexion internet",
  ];

  const features = [
    {
      icon: Package,
      title: "Stocks intelligents",
      desc: "Inventaire en temps réel et alertes automatiques de rupture.",
    },
    {
      icon: Receipt,
      title: "Facturation express",
      desc: "Reçus professionnels en 2 s, partagés par WhatsApp à vos clients.",
    },
    {
      icon: TrendingUp,
      title: "Pilotage financier",
      desc: "Chiffre d'affaires, marges et dettes clients, en un coup d'œil.",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center py-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Decorative blobs (screen only) */}
      <div className="absolute top-1/4 left-1/12 w-96 h-96 bg-orange-600/10 blur-[150px] rounded-full pointer-events-none no-print" />
      <div className="absolute bottom-1/4 right-1/12 w-96 h-96 bg-amber-600/10 blur-[150px] rounded-full pointer-events-none no-print" />

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
                Pro
              </span>
              Flyer Commercial — Édition Premium
            </h1>
            <p className="text-xs text-zinc-500">
              Format A4 • Impression vectorielle nette
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex h-10 items-center gap-2 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm font-bold text-zinc-200 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimer</span>
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

      {/* ── FLYER SHEET (A4) ──────────────────────────────────────────────── */}
      <div
        id="flyer-canvas"
        className="w-full max-w-[210mm] min-h-[297mm] bg-white text-zinc-900 shadow-2xl relative flex flex-col justify-between overflow-hidden select-none"
        style={{ aspectRatio: "1 / 1.4142" }}
      >
        {/* Decorative corner accent (CSS, no SVG) */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/10 blur-2xl pointer-events-none" />

        {/* ── TOP (white) ─────────────────────────────────────────────────── */}
        <div className="p-8 sm:p-12 pb-6 relative z-10 flex-1 flex flex-col justify-between bg-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-6">
            <div className="flex items-center gap-3">
              <BrandLogo size={46} rounded={12} className="shadow-lg shadow-orange-600/15" />
              <div className="flex flex-col leading-none">
                <span className="text-[26px] font-black tracking-tight text-zinc-900">
                  Gestion<span className="text-orange-600">Pro</span>
                </span>
                <span className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.3em] text-orange-600">
                  Gérez mieux • Vendez plus
                </span>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-black tracking-wide text-zinc-700 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
              <Globe className="h-3.5 w-3.5 text-orange-600" />
              Commerçants • Boutiques • PME
            </span>
          </div>

          {/* Hero */}
          <div className="space-y-5 my-auto py-6">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-orange-600 bg-orange-50 px-3 py-1.5 rounded-md border border-orange-100">
              <Sparkles className="h-3.5 w-3.5" />
              Solution commerciale tout-en-un
            </span>

            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-950 leading-[1.05]">
              Pilotez tout votre
              <br />
              commerce depuis{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">
                une seule app
              </span>
            </h2>

            <p className="text-zinc-600 text-sm sm:text-base leading-relaxed max-w-xl">
              Conçue pour les commerçants et entrepreneurs d&apos;Afrique de
              l&apos;Ouest. Suivez vos ventes, vos stocks et vos clients en temps
              réel — au comptoir comme en déplacement.
            </p>

            {/* Benefit checklist */}
            <ul className="space-y-2.5 pt-1">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm font-semibold text-zinc-800">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-600 text-white shadow-sm shadow-orange-600/30">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            {/* Offline highlight */}
            <div className="inline-flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                <WifiOff className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <div className="leading-tight">
                <p className="text-xs font-black text-zinc-900">Mode hors-ligne natif</p>
                <p className="text-[10px] font-semibold text-zinc-500">
                  Vos données se synchronisent au retour du réseau
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── WAVE SEPARATOR (single small CSS svg — build-safe) ──────────── */}
        <div className="relative h-16 w-full -mb-1 z-10 pointer-events-none">
          <svg
            viewBox="0 0 1440 320"
            className="absolute bottom-0 w-full h-24 text-orange-600 fill-current"
            preserveAspectRatio="none"
          >
            <path d="M0,160L80,186.7C160,213,320,267,480,272C640,277,800,235,960,197.3C1120,160,1280,128,1360,112L1440,96L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z" />
          </svg>
        </div>

        {/* ── BOTTOM (orange) ─────────────────────────────────────────────── */}
        <div className="bg-gradient-to-b from-orange-600 via-orange-600 to-amber-700 p-8 sm:p-12 pt-6 relative z-10 text-white">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Feature cards */}
            <div className="md:col-span-7 space-y-5">
              <h3 className="text-lg font-bold uppercase tracking-wider border-b border-orange-500/40 pb-2">
                Tout ce dont votre commerce a besoin
              </h3>

              <div className="space-y-3.5">
                {features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.title}
                      className="bg-white/95 rounded-2xl p-3.5 flex items-start gap-3 shadow-lg shadow-black/10 border border-orange-400/20 text-zinc-900 transition-all hover:translate-x-1"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                        <Icon className="h-5 w-5" strokeWidth={2.5} />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-950 leading-none mb-1">
                          {f.title}
                        </h4>
                        <p className="text-[11px] text-zinc-600 leading-normal">
                          {f.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px] font-black uppercase tracking-widest text-orange-100">
                <Users className="h-3.5 w-3.5" />
                Déjà adopté par des dizaines de boutiques
              </div>
            </div>

            {/* Phone mockup (divs) + contact */}
            <div className="md:col-span-5 flex flex-col items-center gap-6">
              <div className="w-[190px] h-[340px] bg-zinc-900 rounded-[34px] p-2.5 shadow-2xl border-4 border-zinc-800/80 relative overflow-hidden shrink-0">
                <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-zinc-900 rounded-full z-20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
                </div>
                <div className="w-full h-full bg-zinc-50 rounded-[26px] overflow-hidden flex flex-col justify-between text-zinc-900 p-3 pt-6 relative border border-zinc-200">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <BrandLogo size={18} rounded={4} />
                      <span className="text-[9px] font-black tracking-tighter text-black">
                        Gestion<span className="text-orange-600">Pro</span>
                      </span>
                    </div>
                    <span className="text-[7px] font-bold text-zinc-400">Boutique Dakar</span>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-2.5 text-white shadow-sm my-1.5">
                    <span className="text-[7px] uppercase tracking-wider font-semibold opacity-80">
                      Ventes du jour
                    </span>
                    <h5 className="text-sm font-black tracking-tight leading-none my-0.5">
                      145 000 F CFA
                    </h5>
                    <div className="flex items-center justify-between mt-1 text-[7px]">
                      <span>Bénéfice net</span>
                      <span className="font-extrabold bg-white/20 px-1 py-0.5 rounded">
                        +48 000 F
                      </span>
                    </div>
                  </div>
                  <div className="bg-zinc-100 rounded-xl p-2 flex flex-col justify-between flex-1">
                    <span className="text-[7px] font-bold text-zinc-500">Croissance hebdo</span>
                    <div className="h-10 flex items-end gap-1.5 px-1 pb-1">
                      <div className="w-full bg-orange-600/30 rounded-t h-4" />
                      <div className="w-full bg-orange-600/40 rounded-t h-6" />
                      <div className="w-full bg-orange-600/60 rounded-t h-8" />
                      <div className="w-full bg-orange-600/80 rounded-t h-12" />
                      <div className="w-full bg-orange-600 rounded-t h-16" />
                    </div>
                  </div>
                  <div className="border-t border-zinc-100 pt-2 flex items-center justify-between text-[7px] text-zinc-400 font-bold mt-1.5">
                    <span>12 articles</span>
                    <span>+12.4 %</span>
                  </div>
                </div>
              </div>

              {/* Contact + QR */}
              <div className="w-full bg-white rounded-3xl p-5 border border-zinc-100 text-zinc-900 shadow-xl space-y-4">
                <span className="text-xs font-black uppercase tracking-widest text-orange-600">
                  Contactez-nous
                </span>
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-7 space-y-3 text-xs font-bold">
                    <a
                      href="https://wa.me/221773831364"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 hover:text-orange-600 transition-colors"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-sm">
                        <WhatsAppIcon className="h-4 w-4" />
                      </span>
                      <span className="tracking-wide text-zinc-800">+221 77 383 13 64</span>
                    </a>
                    <a
                      href="mailto:dionemhd1@gmail.com"
                      className="flex items-center gap-2.5 hover:text-orange-600 transition-colors"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 border border-zinc-200">
                        <Mail className="h-4 w-4" />
                      </span>
                      <span className="tracking-wide text-zinc-800">dionemhd1@gmail.com</span>
                    </a>
                  </div>
                  <div className="col-span-5 flex justify-center bg-zinc-50 p-2 rounded-2xl border border-zinc-100">
                    {qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrDataUrl}
                        alt="QR code vers la démo GestionPro"
                        className="w-16 h-16 object-contain"
                      />
                    ) : (
                      <div className="w-16 h-16 animate-pulse rounded bg-zinc-100" />
                    )}
                  </div>
                </div>
                <div className="text-center pt-1">
                  <span className="inline-block text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-600">
                    Scannez pour tester la démo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom banner */}
        <div className="bg-orange-600 py-3 text-center border-t border-orange-700/10 relative z-10 no-print">
          <span className="inline-block text-[9px] sm:text-xs font-black uppercase tracking-widest text-black select-none">
            © {new Date().getFullYear()} GestionPro — Démo privée
          </span>
        </div>
      </div>

      {/* ── PRINT-ONLY STYLES (static — no dynamic interpolation) ─────────── */}
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
            background: #ffffff !important;
            color: #000000 !important;
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
            padding: 0 !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            overflow: hidden !important;
            transform: scale(1) !important;
          }
        }
      `}</style>
    </div>
  );
}
