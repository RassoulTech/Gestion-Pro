"use client";

import React from "react";
import Link from "next/link";
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  Check, 
  Package, 
  Receipt, 
  TrendingUp, 
  Users, 
  BarChart3, 
  Mail,
  QrCode
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/brand-icons";
import { BrandLogo } from "@/components/brand-logo";

export default function FlyerPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gestion-pro.vercel.app";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(appUrl)}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center py-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-orange-600/10 blur-[150px] rounded-full pointer-events-none no-print" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-amber-600/10 blur-[150px] rounded-full pointer-events-none no-print" />

      {/* ── TOP ACTION BAR (No Print) ────────────────────────────────────────── */}
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
                Livrable
              </span>
              Flyer Officiel
            </h1>
            <p className="text-xs text-zinc-500">Imprimable au format A4 & Téléchargeable</p>
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

          <a
            href="/gestionpro_flyer.pdf"
            download="gestionpro_flyer.pdf"
            className="inline-flex h-10 items-center gap-2 px-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-sm font-bold text-white transition-all shadow-md active:scale-95 shadow-orange-600/20"
          >
            <Download className="h-4 w-4" />
            <span>Télécharger PDF</span>
          </a>

          <a
            href="/gestionpro_flyer.png"
            download="gestionpro_flyer.png"
            className="inline-flex h-10 items-center gap-2 px-4 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-sm font-bold text-zinc-400 hover:text-zinc-200 transition-all shadow-md active:scale-95"
          >
            <Download className="h-4 w-4" />
            <span>Télécharger PNG</span>
          </a>
        </div>
      </div>

      {/* ── FLYER SHEET CANVAS ───────────────────────────────────────────────── */}
      <div 
        id="flyer-canvas"
        className="w-full max-w-[210mm] min-h-[297mm] bg-white text-zinc-900 shadow-2xl relative flex flex-col justify-between overflow-hidden select-none"
        style={{
          aspectRatio: "1 / 1.4142",
        }}
      >
        {/* ── UPPER PART (White Background) ──────────────────────────────────── */}
        <div className="p-8 sm:p-12 pb-6 relative z-10 flex-1 flex flex-col justify-between">
          {/* Top Logo and Tagline */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <BrandLogo size={42} rounded={10} className="shadow-lg shadow-orange-600/10" />
              <span className="text-2xl font-black tracking-tight text-zinc-900">
                Gestion<span className="text-orange-600">Pro</span>
              </span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
              Gérez mieux, vendez plus
            </span>
          </div>

          {/* Slogan and Core Pitch */}
          <div className="space-y-4 my-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 leading-tight">
              La meilleure application pour <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">
                gérer votre entreprise
              </span>
            </h2>
            <p className="text-zinc-600 text-sm sm:text-base leading-relaxed max-w-xl">
              Découvrez la solution tout-en-un conçue pour simplifier le quotidien des commerçants et entrepreneurs en Afrique de l&apos;Ouest. Suivez vos activités en temps réel et augmentez vos bénéfices.
            </p>

            {/* List of high-fidelity checkmarks */}
            <ul className="space-y-3 pt-2">
              {[
                "Multi-boutique : Pilotez tous vos points de vente en un seul endroit.",
                "Mode hors-ligne : Continuez à enregistrer des ventes même sans connexion internet.",
                "Zéro configuration complexe : Installez et commencez à facturer en 2 minutes.",
                "Marketplace intégrée : Augmentez votre visibilité et vendez vos articles en ligne."
              ].map((text, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm font-semibold text-zinc-800">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── SEPARATOR SPLIT (Wave Curve Overlay) ────────────────────────────── */}
        <div className="relative h-16 w-full -mb-1 z-10 pointer-events-none">
          <svg
            viewBox="0 0 1440 320"
            className="absolute bottom-0 w-full h-24 text-orange-600 fill-current"
            preserveAspectRatio="none"
          >
            <path d="M0,160L80,186.7C160,213,320,267,480,272C640,277,800,235,960,197.3C1120,160,1280,128,1360,112L1440,96L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
          </svg>
        </div>

        {/* ── LOWER PART (Premium Orange Gradient Background) ───────────────── */}
        <div className="bg-gradient-to-b from-orange-600 via-orange-600 to-amber-700 p-8 sm:p-12 pt-6 relative z-10 text-white flex flex-col justify-between">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Left Side: Cards */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold uppercase tracking-wider border-b border-orange-500/40 pb-2">
                Fonctionnalités Clés
              </h3>

              <div className="space-y-4">
                {[
                  {
                    icon: Package,
                    title: "Gestion des stocks",
                    desc: "Suivi en temps réel des entrées, sorties et alertes automatiques de rupture."
                  },
                  {
                    icon: Receipt,
                    title: "Facturation & Reçus",
                    desc: "Édition instantanée de reçus professionnels et envoi direct aux clients par WhatsApp."
                  },
                  {
                    icon: TrendingUp,
                    title: "Suivi des ventes",
                    desc: "Graphiques clairs du chiffre d'affaires, des bénéfices et des performances de vos vendeurs."
                  },
                  {
                    icon: Users,
                    title: "Gestion des clients & Dettes",
                    desc: "Suivi complet de l'historique d'achats et contrôle rigoureux des crédits clients."
                  },
                  {
                    icon: BarChart3,
                    title: "Statistiques en temps réel",
                    desc: "Rapports d'activité complets pour piloter sereinement votre croissance."
                  }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={idx} 
                      className="bg-white/95 rounded-2xl p-3.5 flex items-start gap-3 shadow-lg shadow-black/10 border border-orange-400/20 text-zinc-900 transition-all hover:translate-x-1"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-950 leading-none mb-1">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-zinc-600 leading-normal">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <span className="inline-block text-lg font-black italic tracking-wide text-orange-100 drop-shadow">
                  « Soyez toujours à jour »
                </span>
              </div>
            </div>

            {/* Right Side: Smartphone + Contacts */}
            <div className="flex flex-col items-center justify-between h-full space-y-6">
              
              {/* Smartphone Mock */}
              <div className="w-[200px] h-[360px] bg-zinc-900 rounded-[36px] p-2.5 shadow-2xl border-4 border-zinc-800/80 relative overflow-hidden group">
                {/* Speaker & Camera notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-zinc-900 rounded-full z-20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
                </div>

                {/* Inner Screen */}
                <div className="w-full h-full bg-zinc-50 rounded-[28px] overflow-hidden flex flex-col justify-between text-zinc-900 p-3 pt-6 relative border border-zinc-200">
                  {/* Phone Header */}
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <BrandLogo size={18} rounded={4} />
                      <span className="text-[9px] font-black tracking-tighter">
                        Gestion<span className="text-orange-600">Pro</span>
                      </span>
                    </div>
                    <span className="text-[7px] font-bold text-zinc-400">Boutique Dakar</span>
                  </div>

                  {/* Phone Stats Card */}
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-2.5 text-white shadow-sm my-1.5">
                    <span className="text-[7px] uppercase tracking-wider font-semibold opacity-80">Ventes du Jour</span>
                    <h5 className="text-sm font-black tracking-tight leading-none my-0.5">145 000 F CFA</h5>
                    <div className="flex items-center justify-between mt-1 text-[7px]">
                      <span>Bénéfice net</span>
                      <span className="font-extrabold bg-white/20 px-1 py-0.5 rounded">+48 000 F</span>
                    </div>
                  </div>

                  {/* Phone Mini Graph */}
                  <div className="bg-zinc-100 rounded-xl p-2 flex flex-col justify-between flex-1">
                    <span className="text-[7px] font-bold text-zinc-500">Courbe de croissance</span>
                    <div className="h-10 flex items-end gap-1.5 px-1 pb-1">
                      <div className="w-full bg-orange-600/30 rounded-t h-4" />
                      <div className="w-full bg-orange-600/40 rounded-t h-6" />
                      <div className="w-full bg-orange-600/60 rounded-t h-8" />
                      <div className="w-full bg-orange-600/80 rounded-t h-12 animate-pulse" />
                      <div className="w-full bg-orange-600 rounded-t h-16" />
                    </div>
                  </div>

                  {/* Phone Footer */}
                  <div className="border-t border-zinc-100 pt-2 flex items-center justify-between text-[7px] text-zinc-400 font-bold mt-1.5">
                    <span>📦 12 Articles</span>
                    <span>📈 +12.4%</span>
                  </div>
                </div>
              </div>

              {/* Contacts & QR Code */}
              <div className="w-full bg-white/10 rounded-3xl p-5 border border-white/10 text-center space-y-4 backdrop-blur-md">
                <span className="text-xs font-black uppercase tracking-widest text-orange-200">
                  Contactez-Nous
                </span>

                <div className="space-y-2.5 text-xs font-semibold">
                  <a 
                    href="https://wa.me/221773831364" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-center gap-2.5 hover:text-orange-200 transition-colors"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <WhatsAppIcon className="h-4 w-4" />
                    </span>
                    <span className="tracking-wide text-zinc-100">+221 77 383 13 64</span>
                  </a>

                  <a 
                    href="mailto:dionemhd1@gmail.com" 
                    className="flex items-center justify-center gap-2.5 hover:text-orange-200 transition-colors"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <Mail className="h-4 w-4" />
                    </span>
                    <span className="tracking-wide text-zinc-100">dionemhd1@gmail.com</span>
                  </a>
                </div>

                {/* QR Code Placeholder with real scan intent */}
                <div className="flex items-center justify-center gap-3 bg-white/5 rounded-2xl p-3 border border-white/5">
                  <div className="bg-white p-1 rounded-xl shadow-inner shrink-0 w-12 h-12 flex items-center justify-center">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className="h-10 w-10 object-contain" 
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-wider text-orange-200 leading-none mb-1">
                      Scannez pour tester
                    </p>
                    <p className="text-[9px] text-zinc-300 leading-tight">
                      Accédez au formulaire de test privé et réservez votre accès.
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="inline-block text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 border border-white/20 text-orange-100">
                    Disponible prochainement • Test Privé
                  </span>
                </div>

              </div>

            </div>
          </div>
        </div>

      </div>

      {/* ── GLOBAL PRINT-ONLY STYLES ─────────────────────────────────────────── */}
      <style jsx global>{`
        @media print {
          /* Force standard landscape or portrait layout size */
          @page {
            size: A4 portrait !important;
            margin: 0 !important;
          }
          
          /* Hide all surrounding containers and framework artifacts */
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

          /* Reset body and core tags to fit A4 perfectly */
          html, body {
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

          /* Maximize the sheet canvas */
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

          /* Smooth and scale font structures for paper */
          h2 {
            font-size: 28pt !important;
            line-height: 1.2 !important;
          }
          p {
            font-size: 11pt !important;
          }
          li {
            font-size: 10pt !important;
          }
        }
      `}</style>

    </div>
  );
}
