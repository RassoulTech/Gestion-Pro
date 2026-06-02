"use client";

import React from "react";
import Link from "next/link";
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  Package, 
  Receipt, 
  TrendingUp, 
  Users, 
  BarChart3, 
  Mail
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/brand-icons";

export default function FlyerPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gestion-pro.vercel.app";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(appUrl)}`;

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
              Flyer Premium
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

      {/* ── FLYER SHEET CANVAS (A4 Format) ───────────────────────────────────── */}
      <div 
        id="flyer-canvas"
        className="w-full max-w-[210mm] min-h-[297mm] bg-white text-zinc-900 shadow-2xl relative flex flex-col justify-between overflow-hidden select-none border border-zinc-100"
        style={{
          aspectRatio: "1 / 1.4142",
        }}
      >
        {/* Main Content Area */}
        <div className="p-10 sm:p-14 pb-4 flex-1 flex flex-col justify-between">
          
          {/* Header Section */}
          <div className="space-y-4">
            {/* Unified Logo */}
            <div className="flex items-center gap-3">
              {/* Official G Logo: Orange rounded square with bold white G */}
              <div className="w-12 h-12 bg-orange-600 text-white font-black text-2xl rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20 select-none shrink-0">
                G
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black font-sans">
                GestionPro
              </h2>
            </div>

            {/* Tagline label: Solid premium orange */}
            <div>
              <span className="inline-block text-[10px] sm:text-xs font-black uppercase tracking-widest bg-orange-600 text-white px-4 py-1.5 rounded-full select-none shadow-sm shadow-orange-600/10">
                Gerez mieux, vendez plus
              </span>
            </div>

            {/* Main title: Large bold black text */}
            <h3 className="text-3xl sm:text-[38px] font-black tracking-tight text-black leading-tight pt-2 font-sans">
              La meilleure application pour <br />
              gérer votre entreprise
            </h3>
          </div>

          {/* Core Grid: Features on left, smartphone mockup on right */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center my-auto pt-6">
            
            {/* Left Side: 5 Horizontal minimalist feature blocks */}
            <div className="md:col-span-7 space-y-4">
              {[
                {
                  icon: Package,
                  title: "Gestion des stocks",
                  desc: "Suivi en temps réel des entrées, sorties et alertes de rupture."
                },
                {
                  icon: Receipt,
                  title: "Facturation",
                  desc: "Édition instantanée de reçus professionnels et envoi direct."
                },
                {
                  icon: TrendingUp,
                  title: "Suivi des ventes",
                  desc: "Rapports clairs du chiffre d'affaires et de vos bénéfices."
                },
                {
                  icon: Users,
                  title: "Gestion des clients",
                  desc: "Historique d'achats complet et contrôle des crédits."
                },
                {
                  icon: BarChart3,
                  title: "Statistiques en temps réel",
                  desc: "Indicateurs de performance pour piloter votre croissance."
                }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={idx} 
                    className="flex items-center gap-4 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 transition-all hover:bg-zinc-100/50"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-600/10 text-orange-600">
                      <Icon className="h-6 w-6" strokeWidth={2.5} />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-black leading-none mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-zinc-500 leading-normal">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Side: Modern Smartphone Mockup */}
            <div className="md:col-span-5 flex justify-center">
              <div className="w-[210px] h-[380px] bg-zinc-900 rounded-[40px] p-3 shadow-2xl border-4 border-zinc-800 relative overflow-hidden shrink-0">
                {/* iPhone Dynamic Island */}
                <div className="absolute top-4.5 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-black rounded-full z-20 flex items-center justify-center">
                  <div className="w-1 h-1 bg-zinc-900 rounded-full absolute right-2" />
                </div>

                {/* Inner Screen */}
                <div className="w-full h-full bg-zinc-50 rounded-[30px] overflow-hidden flex flex-col justify-between text-zinc-900 p-3.5 pt-7.5 relative border border-zinc-200">
                  {/* Phone Header */}
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-[16px] h-[16px] bg-orange-600 text-white font-black text-[9px] rounded flex items-center justify-center select-none">
                        G
                      </div>
                      <span className="text-[8px] font-black tracking-tight text-black">
                        GestionPro
                      </span>
                    </div>
                    <span className="text-[6px] font-bold text-zinc-400">Boutique Dakar</span>
                  </div>

                  {/* Phone Stats Card */}
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-3 text-white shadow-md my-2">
                    <span className="text-[6px] uppercase tracking-wider font-semibold opacity-85">Chiffre d&apos;affaires</span>
                    <h5 className="text-xs font-black tracking-tight leading-none my-0.5">145 000 F CFA</h5>
                    <div className="flex items-center justify-between mt-1.5 text-[6px] opacity-90">
                      <span>Bénéfice net</span>
                      <span className="font-extrabold bg-white/20 px-1 py-0.5 rounded">+48 000 F</span>
                    </div>
                  </div>

                  {/* Phone Mini Graph */}
                  <div className="bg-zinc-100 rounded-xl p-2 flex flex-col justify-between flex-1">
                    <span className="text-[6px] font-bold text-zinc-400 uppercase tracking-wider">Évolution mensuelle</span>
                    <div className="h-12 flex items-end gap-1.5 px-1 pb-1">
                      <div className="w-full bg-orange-600/20 rounded-t h-4" />
                      <div className="w-full bg-orange-600/30 rounded-t h-6" />
                      <div className="w-full bg-orange-600/50 rounded-t h-8" />
                      <div className="w-full bg-orange-600/70 rounded-t h-11" />
                      <div className="w-full bg-orange-600 rounded-t h-16" />
                    </div>
                  </div>

                  {/* Phone Footer */}
                  <div className="border-t border-zinc-100 pt-2 flex items-center justify-between text-[6px] text-zinc-400 font-bold mt-2">
                    <span>📦 12 Articles</span>
                    <span>📈 +12.4%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Card: Contact Box & Grand QR Code */}
          <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-6 mt-6">
            {/* Contact Details */}
            <div className="space-y-4 text-left">
              <span className="text-xs font-black uppercase tracking-wider text-orange-600">
                Contactez-Nous
              </span>

              <div className="space-y-3 text-xs font-bold">
                <a 
                  href="https://wa.me/221773831364" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 text-black hover:text-orange-600 transition-colors"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-600/10 text-orange-600">
                    <WhatsAppIcon className="h-4 w-4" />
                  </span>
                  <span className="tracking-wide">+221 77 383 13 64</span>
                </a>

                <a 
                  href="mailto:dionemhd1@gmail.com" 
                  className="flex items-center gap-3 text-black hover:text-orange-600 transition-colors"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-600/10 text-orange-600">
                    <Mail className="h-4 w-4" />
                  </span>
                  <span className="tracking-wide">dionemhd1@gmail.com</span>
                </a>
              </div>
            </div>

            {/* Separator Line */}
            <div className="hidden sm:block w-px h-16 bg-zinc-200" />

            {/* A single, large, high-definition QR Code */}
            <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-zinc-100 shadow-sm shrink-0">
              <img 
                src={qrCodeUrl} 
                alt="QR Code de l'application" 
                className="w-20 h-20 object-contain" 
              />
              <div className="text-left max-w-[150px]">
                <p className="text-[10px] font-black uppercase tracking-wider text-black leading-none mb-1">
                  Scannez pour tester
                </p>
                <p className="text-[8px] text-zinc-500 leading-tight">
                  Accédez instantanément au formulaire de test privé de GestionPro.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ── FOOTER EDGE BLOCK (Solid Premium Orange) ────────────────────────── */}
        <div className="bg-orange-600 py-3 text-center border-t border-orange-700/10 relative z-10">
          <span className="inline-block text-[9px] sm:text-xs font-black uppercase tracking-widest text-black select-none">
            Disponible prochainement - Version de test privé
          </span>
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
          h3 {
            font-size: 26pt !important;
            line-height: 1.2 !important;
          }
          p {
            font-size: 10pt !important;
          }
          li {
            font-size: 9pt !important;
          }
        }
      `}</style>

    </div>
  );
}
