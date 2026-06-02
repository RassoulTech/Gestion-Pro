"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Printer,
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
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/brand-icons";
import { BrandLogo } from "@/components/brand-logo";

/**
 * Flyer commercial "Pro" — mise en page inspirée du modèle BrandPacks
 * (vague orange, mockup téléphone, liste de fonctionnalités à icônes, CTA).
 * Adapté à l'identité GestionPro (orange #ea580c) et 100 % vectoriel pour
 * un rendu net à l'impression A4 / export PDF / PNG.
 */
export default function FlyerProPage() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://gestion-pro.vercel.app";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${encodeURIComponent(
    appUrl
  )}`;

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 850) {
        setPreviewScale(Math.max(0.3, (width - 48) / 794));
      } else {
        setPreviewScale(1);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Le flyer est 100 % vectoriel : on l'exporte via l'impression native du
  // navigateur ("Enregistrer en PDF") → rendu A4 net, sans html2canvas
  // (cette lib bloquait la compilation du build de production).
  const handlePrint = () => {
    setIsExportingPdf(true);
    window.print();
    setIsExportingPdf(false);
  };

  const benefits = [
    "Suivez vos ventes et bénéfices en temps réel",
    "Maîtrisez vos stocks, vos marges et vos dépenses",
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
      desc: "Chiffre d'affaires, marges et dettes clients clairs, en un clin d'œil.",
    },
  ];

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6">
      {/* Decorative blobs (screen only) */}
      <div className="no-print pointer-events-none absolute left-1/10 top-1/4 h-96 w-96 rounded-full bg-orange-600/10 blur-[150px]" />
      <div className="no-print pointer-events-none absolute bottom-1/4 right-1/10 h-96 w-96 rounded-full bg-amber-600/10 blur-[150px]" />

      {/* ── ACTION BAR (no print) ─────────────────────────────────────────── */}
      <div className="no-print z-20 mb-6 flex w-full max-w-[794px] flex-col items-center justify-between gap-4 rounded-3xl border border-zinc-800/80 bg-zinc-900/80 p-4 shadow-2xl backdrop-blur-xl sm:flex-row">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-400 transition-all hover:border-zinc-700 hover:text-zinc-100"
            aria-label="Retour à l'accueil"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-sm font-bold text-zinc-100">
              <span className="rounded border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-orange-500">
                Pro
              </span>
              Flyer Commercial — Édition Vague
            </h1>
            <p className="text-xs text-zinc-500">
              Mise en page A4 vectorielle, inspirée modèle premium
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            disabled={isExportingPdf}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-2xl bg-orange-600 px-5 text-sm font-bold text-white shadow-md shadow-orange-600/20 transition-all hover:bg-orange-500 active:scale-95 disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimer / Enregistrer en PDF</span>
          </button>
        </div>
      </div>

      {/* ── FLYER SHEET ───────────────────────────────────────────────────── */}
      <div className="flyer-preview-container flex w-full select-none justify-center overflow-visible py-4">
        <div className="flyer-scaler origin-top transition-transform duration-200">
          <div
            id="flyer-canvas"
            className="relative flex flex-col overflow-hidden bg-white text-zinc-900 shadow-2xl"
            style={{ boxSizing: "border-box" }}
          >
            {/* Top-right decorative orange arc */}
            <svg
              className="pointer-events-none absolute right-0 top-0 h-64 w-64"
              viewBox="0 0 256 256"
              fill="none"
            >
              <path
                d="M256 0 L256 200 A200 200 0 0 0 56 0 Z"
                fill="url(#arcGrad)"
                opacity="0.12"
              />
              <path
                d="M256 0 L256 130 A130 130 0 0 0 126 0 Z"
                fill="url(#arcGrad)"
                opacity="0.18"
              />
              <defs>
                <linearGradient id="arcGrad" x1="256" y1="0" x2="80" y2="200">
                  <stop stopColor="#f97316" />
                  <stop offset="1" stopColor="#ea580c" />
                </linearGradient>
              </defs>
            </svg>

            {/* ===== TOP WHITE ZONE : header + hero ===== */}
            <div className="relative z-10 flex flex-col px-14 pt-12">
              {/* HEADER */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <BrandLogo
                    size={50}
                    rounded={14}
                    className="shadow-md shadow-orange-600/20"
                  />
                  <div className="flex flex-col leading-none">
                    <span className="text-[25px] font-black tracking-tight text-zinc-950">
                      Gestion<span className="text-orange-600">Pro</span>
                    </span>
                    <span className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.3em] text-orange-600">
                      Gérez mieux • Vendez plus
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3.5 py-1.5">
                  <Globe className="h-3.5 w-3.5 text-orange-600" />
                  <span className="text-[10px] font-black tracking-wide text-zinc-700">
                    gestion-pro.vercel.app
                  </span>
                </div>
              </div>

              {/* HERO */}
              <div className="mt-9 grid grid-cols-12 items-start gap-6">
                {/* Left: copy + benefits */}
                <div className="col-span-7 space-y-5">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-orange-100 bg-orange-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest text-orange-600">
                    <Sparkles className="h-3.5 w-3.5" />
                    Solution commerciale tout-en-un
                  </span>

                  <h2 className="text-[33px] font-black leading-[1.1] tracking-tight text-zinc-950">
                    Pilotez tout votre
                    <br />
                    commerce depuis
                    <br />
                    <span className="text-orange-600">une seule app</span>
                  </h2>

                  <p className="max-w-[330px] text-[12px] leading-relaxed text-zinc-600">
                    Conçue pour les commerçants et entrepreneurs d&apos;Afrique
                    de l&apos;Ouest. GestionPro simplifie vos ventes, vos stocks
                    et vos clients — au comptoir comme en déplacement.
                  </p>

                  {/* Benefit checklist */}
                  <ul className="space-y-2.5 pt-1">
                    {benefits.map((b) => (
                      <li key={b} className="flex items-center gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-600 text-white">
                          <Check className="h-3 w-3" strokeWidth={3.5} />
                        </span>
                        <span className="text-[12px] font-bold text-zinc-800">
                          {b}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Offline highlight pill */}
                  <div className="inline-flex items-center gap-2.5 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                      <WifiOff className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    <div className="leading-tight">
                      <p className="text-[11px] font-black text-zinc-900">
                        Mode hors-ligne natif
                      </p>
                      <p className="text-[9px] font-semibold text-zinc-500">
                        Vos données se synchronisent dès le retour du réseau
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: vector phone mockup */}
                <div className="col-span-5 flex justify-center pt-1">
                  <svg
                    width="210"
                    height="430"
                    viewBox="0 0 260 530"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-2xl"
                  >
                    <rect x="8" y="8" width="244" height="514" rx="44" fill="#000000" fillOpacity="0.1" />
                    <rect x="6" y="6" width="248" height="518" rx="46" fill="#18181b" stroke="#ea580c" strokeWidth="2.5" />
                    <rect x="10" y="10" width="240" height="510" rx="42" fill="#09090b" />
                    <rect x="16" y="16" width="228" height="498" rx="36" fill="#f8fafc" />
                    <rect x="90" y="16" width="80" height="20" rx="10" fill="#09090b" />
                    <circle cx="105" cy="26" r="3" fill="#1e293b" />
                    <rect x="120" y="24" width="35" height="4" rx="2" fill="#1e293b" />
                    <text x="32" y="32" fill="#64748b" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold">9:41</text>
                    <path d="M204 27h3v6h-3zm4 2h3v4h-3zm4-3h3v7h-3zm4-2h3v9h-3z" fill="#cbd5e1" />
                    <path d="M224 25h12v7h-12zm12 2h1v3h-1z" fill="#cbd5e1" />
                    <g transform="translate(16, 46)">
                      <rect x="12" y="8" width="20" height="20" rx="6" fill="#ea580c" />
                      <text x="22" y="22.5" textAnchor="middle" fill="#ffffff" fontSize="11" fontFamily="sans-serif" fontWeight="900">G</text>
                      <text x="38" y="22" fill="#0f172a" fontSize="11" fontFamily="sans-serif" fontWeight="900">GestionPro</text>
                      <rect x="156" y="13" width="22" height="10" rx="3" fill="#ffedd5" stroke="#fed7aa" strokeWidth="0.5" />
                      <text x="159" y="20.5" fill="#ea580c" fontSize="6.5" fontFamily="sans-serif" fontWeight="bold">LIVE</text>
                      <line x1="12" y1="36" x2="216" y2="36" stroke="#f1f5f9" strokeWidth="1" />
                    </g>
                    <g transform="translate(16, 94)">
                      <rect x="10" y="4" width="208" height="86" rx="16" fill="url(#phone-grad)" />
                      <text x="24" y="24" fill="#ffedd5" fontSize="8" fontFamily="sans-serif" fontWeight="bold" letterSpacing="0.8">VENTES DU JOUR</text>
                      <text x="24" y="48" fill="#ffffff" fontSize="18" fontFamily="sans-serif" fontWeight="900">145 000 F CFA</text>
                      <rect x="24" y="60" width="70" height="16" rx="6" fill="#ffffff" fillOpacity="0.2" />
                      <text x="30" y="70.5" fill="#ffffff" fontSize="7" fontFamily="sans-serif" fontWeight="bold">Bénéfice : +48 000 F</text>
                      <text x="168" y="71" fill="#ffffff" fontSize="9" fontFamily="sans-serif" fontWeight="900">+12.4%</text>
                      <path d="M152 69l3-3 3 3 5-5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    <g transform="translate(16, 196)">
                      <rect x="10" y="0" width="208" height="96" rx="16" fill="#ffffff" stroke="#f1f5f9" strokeWidth="1" />
                      <text x="22" y="18" fill="#0f172a" fontSize="9" fontFamily="sans-serif" fontWeight="bold">Performance Hebdo</text>
                      <line x1="22" y1="40" x2="206" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="22" y1="62" x2="206" y2="62" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="22" y1="84" x2="206" y2="84" stroke="#f1f5f9" strokeWidth="1" />
                      <rect x="34" y="68" width="14" height="16" rx="3" fill="#ea580c" fillOpacity="0.3" />
                      <rect x="58" y="52" width="14" height="32" rx="3" fill="#ea580c" fillOpacity="0.4" />
                      <rect x="82" y="44" width="14" height="40" rx="3" fill="#ea580c" fillOpacity="0.6" />
                      <rect x="106" y="32" width="14" height="52" rx="3" fill="#ea580c" fillOpacity="0.8" />
                      <rect x="130" y="24" width="14" height="60" rx="3" fill="#ea580c" />
                      <rect x="154" y="28" width="14" height="56" rx="3" fill="#ea580c" />
                      <rect x="178" y="18" width="14" height="66" rx="3" fill="#f97316" />
                    </g>
                    <g transform="translate(16, 304)">
                      <rect x="10" y="0" width="208" height="106" rx="16" fill="#ffffff" stroke="#f1f5f9" strokeWidth="1" />
                      <text x="22" y="18" fill="#0f172a" fontSize="9" fontFamily="sans-serif" fontWeight="bold">Dernières Activités</text>
                      <g transform="translate(12, 28)">
                        <rect x="10" y="0" width="184" height="32" rx="10" fill="#f8fafc" />
                        <circle cx="24" cy="16" r="8" fill="#ffedd5" />
                        <path d="M22 13v6M20 16h8" stroke="#ea580c" strokeWidth="1.2" strokeLinecap="round" />
                        <text x="38" y="15" fill="#0f172a" fontSize="8" fontFamily="sans-serif" fontWeight="bold">Vente #8843</text>
                        <text x="38" y="23" fill="#64748b" fontSize="6.5" fontFamily="sans-serif">Mamadou S. • Dakar</text>
                        <text x="142" y="20" fill="#16a34a" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold">+45 000 F</text>
                      </g>
                      <g transform="translate(12, 64)">
                        <rect x="10" y="0" width="184" height="32" rx="10" fill="#f8fafc" />
                        <circle cx="24" cy="16" r="8" fill="#fee2e2" />
                        <path d="M20 16h8" stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round" />
                        <text x="38" y="15" fill="#0f172a" fontSize="8" fontFamily="sans-serif" fontWeight="bold">Achat Stock #01</text>
                        <text x="38" y="23" fill="#64748b" fontSize="6.5" fontFamily="sans-serif">Grossiste Sodida</text>
                        <text x="142" y="20" fill="#dc2626" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold">-28 000 F</text>
                      </g>
                    </g>
                    <rect x="95" y="504" width="70" height="4" rx="2" fill="#cbd5e1" />
                    <defs>
                      <linearGradient id="phone-grad" x1="10" y1="4" x2="218" y2="90" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#ea580c" />
                        <stop offset="1" stopColor="#f97316" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>

            {/* ===== ORANGE WAVE ZONE : features + contact ===== */}
            <div className="relative z-10 mt-6 flex-1">
              {/* Curved white→orange transition */}
              <svg
                className="absolute -top-px left-0 h-12 w-full"
                viewBox="0 0 794 50"
                preserveAspectRatio="none"
                fill="none"
              >
                <path d="M0 50 L0 18 C260 -12 540 60 794 14 L794 50 Z" fill="url(#waveGrad)" />
                <defs>
                  <linearGradient id="waveGrad" x1="0" y1="0" x2="794" y2="50">
                    <stop stopColor="#ea580c" />
                    <stop offset="1" stopColor="#c2410c" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="flex h-full flex-col bg-gradient-to-br from-orange-600 to-orange-700 px-14 pb-10 pt-8">
                {/* Section heading */}
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-orange-100">
                      Fonctionnalités clés
                    </span>
                    <h3 className="mt-1 text-[22px] font-black leading-tight text-white">
                      Tout ce dont votre commerce a besoin
                    </h3>
                  </div>
                  <span className="hidden items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white sm:inline-flex">
                    <Users className="h-3 w-3" /> + de 30 boutiques
                  </span>
                </div>

                {/* Feature cards */}
                <div className="mt-5 grid grid-cols-3 gap-4">
                  {features.map((f) => {
                    const Icon = f.icon;
                    return (
                      <div
                        key={f.title}
                        className="rounded-2xl border border-orange-100/60 bg-white p-4 shadow-lg shadow-orange-900/10"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                          <Icon className="h-5 w-5" strokeWidth={2.5} />
                        </span>
                        <h4 className="mt-3 text-[13px] font-black leading-tight text-zinc-900">
                          {f.title}
                        </h4>
                        <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">
                          {f.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Contact strip */}
                <div className="mt-auto flex items-center justify-between gap-6 rounded-2xl bg-zinc-950 p-4 pl-6 shadow-xl">
                  <div className="space-y-2.5">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-orange-400">
                      Contactez-nous
                    </span>
                    <div className="flex flex-col gap-1.5 text-[11px] font-bold text-white">
                      <span className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                          <WhatsAppIcon className="h-3 w-3" />
                        </span>
                        +221 77 383 13 64
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300">
                          <Mail className="h-3 w-3" />
                        </span>
                        dionemhd1@gmail.com
                      </span>
                    </div>
                  </div>

                  {/* QR + scan CTA */}
                  <div className="flex items-center gap-3 rounded-xl bg-white p-2.5 pr-4">
                    <img
                      src={qrCodeUrl}
                      alt="QR code vers la démo GestionPro"
                      className="h-16 w-16 rounded-md object-contain"
                      crossOrigin="anonymous"
                    />
                    <div className="leading-tight">
                      <p className="text-[11px] font-black text-zinc-900">
                        Testez la démo
                      </p>
                      <p className="text-[9px] font-bold text-zinc-500">
                        Scannez ce code
                        <br />
                        depuis votre mobile
                      </p>
                    </div>
                  </div>
                </div>

                {/* Legal line */}
                <p className="mt-3 text-center text-[8px] font-extrabold uppercase tracking-[0.25em] text-orange-200/80">
                  © {new Date().getFullYear()} GestionPro — Démo privée • gestion-pro.vercel.app
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PRINT & PREVIEW STYLES ────────────────────────────────────────── */}
      <style jsx global>{`
        @media screen {
          .flyer-preview-container {
            height: ${1123 * previewScale}px;
          }
          .flyer-scaler {
            transform: scale(${previewScale});
            width: 794px;
            height: 1123px;
          }
          #flyer-canvas {
            width: 794px;
            height: 1123px;
            border: 1px solid #e4e4e7;
          }
        }
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 0 !important;
          }
          nav,
          footer,
          header,
          .no-print,
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
          .flyer-preview-container {
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .flyer-scaler {
            transform: none !important;
            width: 210mm !important;
            height: 297mm !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
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
            page-break-after: avoid !important;
            overflow: hidden !important;
          }
        }
      `}</style>
    </div>
  );
}
