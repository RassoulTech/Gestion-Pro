"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  Package, 
  Receipt, 
  TrendingUp, 
  Users, 
  Mail,
  Sparkles
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/brand-icons";
import { BrandLogo } from "@/components/brand-logo";

export default function FlyerPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gestion-pro.vercel.app";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(appUrl)}`;

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);

  // Compute dynamic scale to fit smaller viewports perfectly on preview
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 850) {
        const newScale = Math.max(0.3, (width - 48) / 794);
        setPreviewScale(newScale);
      } else {
        setPreviewScale(1);
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Le flyer est rendu en vecteurs : l'impression native du navigateur
  // ("Enregistrer en PDF") produit un PDF A4 net, sans html2canvas — cette lib
  // bloquait la compilation du build de production (hang jusqu'au timeout).
  const handleDownloadPDF = () => {
    setIsExportingPdf(true);
    window.print();
    setIsExportingPdf(false);
  };

  const handleDownloadPNG = () => {
    setIsExportingPng(true);
    window.print();
    setIsExportingPng(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center py-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Decorative Blobs for Screen preview */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-orange-600/10 blur-[150px] rounded-full pointer-events-none no-print" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-amber-600/10 blur-[150px] rounded-full pointer-events-none no-print" />

      {/* ── TOP ACTION BAR (No Print) ────────────────────────────────────────── */}
      <div className="w-full max-w-[794px] mb-6 bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl z-20 no-print">
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
                PRO
              </span>
              Flyer Commercial Vectoriel
            </h1>
            <p className="text-xs text-zinc-500">Mise en page A4 ultra-haute fidélité pour impression</p>
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
            onClick={handleDownloadPDF}
            disabled={isExportingPdf}
            className="inline-flex h-10 items-center gap-2 px-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-sm font-bold text-white transition-all shadow-md active:scale-95 shadow-orange-600/20 cursor-pointer disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{isExportingPdf ? "Génération PDF..." : "Télécharger PDF"}</span>
          </button>

          <button
            onClick={handleDownloadPNG}
            disabled={isExportingPng}
            className="inline-flex h-10 items-center gap-2 px-4 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-sm font-bold text-zinc-400 hover:text-zinc-200 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{isExportingPng ? "Génération PNG..." : "Télécharger PNG"}</span>
          </button>
        </div>
      </div>

      {/* ── FLYER SHEET CONTAINER ─────────────────────────────────────────── */}
      <div className="flyer-preview-container flex justify-center py-4 select-none overflow-visible w-full">
        <div className="flyer-scaler origin-top transition-transform duration-200">
          {/* FLYER CANVAS SHEET */}
          <div 
            id="flyer-canvas"
            className="bg-white text-zinc-900 shadow-2xl relative flex flex-col justify-between overflow-hidden p-12 pl-16"
            style={{
              boxSizing: "border-box",
            }}
          >
            {/* Elegant Background Grid Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:20px_20px] opacity-35 pointer-events-none" />

            {/* Premium left orange border bar */}
            <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-orange-600" />

            {/* 1. HEADER SECTION */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-6 relative z-10">
              <div className="flex items-center gap-3.5">
                <BrandLogo size={52} rounded={14} className="shadow-md shadow-orange-600/10" />
                <div className="flex flex-col">
                  <span className="text-[26px] font-black tracking-tight text-zinc-950 leading-none">
                    Gestion<span className="text-orange-600">Pro</span>
                  </span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                    Solution Commerciale de Référence
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-white bg-orange-600 px-4 py-1.5 rounded-full shadow-md shadow-orange-600/20">
                  Gérez mieux, vendez plus
                </span>
                <span className="text-[8px] font-bold text-zinc-400 mt-1.5 uppercase tracking-wider">
                  Version 2.0 • Pro
                </span>
              </div>
            </div>

            {/* 2. BODY CONTENT SECTION (TWO COLUMNS) */}
            <div className="grid grid-cols-12 gap-8 items-start my-auto relative z-10">
              
              {/* LEFT COLUMN: HERO TEXT & FEATURE LIST */}
              <div className="col-span-7 space-y-6">
                
                {/* Hero Pitch */}
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100">
                    <Sparkles className="w-3.5 h-3.5" />
                    L&apos;application Tout-en-Un
                  </span>
                  <h2 className="text-[32px] font-black tracking-tight text-zinc-950 leading-[1.15]">
                    Propulsez votre <br />
                    commerce au <br />
                    <span className="text-orange-600">niveau supérieur</span>
                  </h2>
                  <p className="text-zinc-600 text-[12px] leading-relaxed">
                    Conçue pour simplifier le quotidien des commerçants et entrepreneurs en Afrique de l&apos;Ouest. Suivez vos ventes, vos stocks et vos clients en temps réel, même sans connexion internet.
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-4 pt-1">
                  {[
                    {
                      icon: Package,
                      title: "Gestion des Stocks & Alertes",
                      desc: "Inventaire en temps réel, valorisation automatique et notifications instantanées de rupture de stock."
                    },
                    {
                      icon: Receipt,
                      title: "Facturation WhatsApp Express",
                      desc: "Édition de reçus professionnels en 2 secondes et partage automatique à vos clients via WhatsApp."
                    },
                    {
                      icon: TrendingUp,
                      title: "Suivi Financier de Précision",
                      desc: "Graphiques limpides du chiffre d&apos;affaires, des marges nettes et des dépenses courantes."
                    },
                    {
                      icon: Users,
                      title: "Clients & Contrôle des Dettes",
                      desc: "Historique d&apos;achat client détaillé et suivi automatisé des crédits pour accélérer vos encaissements."
                    }
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div 
                        key={idx} 
                        className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100/80 transition-all duration-200 hover:border-orange-500/20 hover:bg-orange-50/5"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                          <Icon className="h-5 w-5" strokeWidth={2.5} />
                        </span>
                        <div className="space-y-0.5">
                          <h4 className="text-[13px] font-extrabold text-zinc-900 leading-tight">
                            {item.title}
                          </h4>
                          <p className="text-[10.5px] text-zinc-500 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* RIGHT COLUMN: PREMIUM SVG PHONE MOCKUP & QR CODE CARD */}
              <div className="col-span-5 flex flex-col items-center justify-center space-y-5 pl-2">
                
                {/* 100% Crisp Vector Smartphone SVG Mockup */}
                <svg 
                  width="220" 
                  height="450" 
                  viewBox="0 0 260 530" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-xl"
                >
                  {/* Phone Outer Shadow */}
                  <rect x="8" y="8" width="244" height="514" rx="44" fill="#000000" fillOpacity="0.1" />
                  
                  {/* Phone Frame / Bezel */}
                  <rect x="6" y="6" width="248" height="518" rx="46" fill="#18181b" stroke="#ea580c" strokeWidth="2.5" />
                  <rect x="10" y="10" width="240" height="510" rx="42" fill="#09090b" />
                  
                  {/* Inner Screen */}
                  <rect x="16" y="16" width="228" height="498" rx="36" fill="#f8fafc" />
                  
                  {/* Island/Notch */}
                  <rect x="90" y="16" width="80" height="20" rx="10" fill="#09090b" />
                  <circle cx="105" cy="26" r="3" fill="#1e293b" />
                  <rect x="120" y="24" width="35" height="4" rx="2" fill="#1e293b" />

                  {/* Status Bar */}
                  <text x="32" y="32" fill="#64748b" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold">9:41</text>
                  <path d="M204 27h3v6h-3zm4 2h3v4h-3zm4-3h3v7h-3zm4-2h3v9h-3z" fill="#cbd5e1" />
                  <path d="M224 25h12v7h-12zm12 2h1v3h-1z" fill="#cbd5e1" />
                  
                  {/* App Bar / Header */}
                  <g transform="translate(16, 46)">
                    <rect x="12" y="8" width="20" height="20" rx="6" fill="#ea580c" />
                    <rect x="16" y="12" width="12" height="12" rx="2" fill="#ffffff" />
                    <text x="19" y="21" fill="#ea580c" fontSize="10" fontFamily="sans-serif" fontWeight="900">G</text>
                    <text x="38" y="22" fill="#0f172a" fontSize="11" fontFamily="sans-serif" fontWeight="900">GestionPro</text>
                    
                    <rect x="156" y="13" width="22" height="10" rx="3" fill="#ffedd5" stroke="#fed7aa" strokeWidth="0.5" />
                    <text x="159" y="20.5" fill="#ea580c" fontSize="6.5" fontFamily="sans-serif" fontWeight="bold">LIVE</text>
                    <line x1="12" y1="36" x2="216" y2="36" stroke="#f1f5f9" strokeWidth="1" />
                  </g>

                  {/* Dashboard Content */}
                  {/* KPI Card */}
                  <g transform="translate(16, 94)">
                    <rect x="10" y="4" width="208" height="86" rx="16" fill="url(#phone-grad)" />
                    <text x="24" y="24" fill="#ffedd5" fontSize="8" fontFamily="sans-serif" fontWeight="bold" letterSpacing="0.8">VENTES DU JOUR</text>
                    <text x="24" y="48" fill="#ffffff" fontSize="18" fontFamily="sans-serif" fontWeight="900">145 000 F CFA</text>
                    
                    <rect x="24" y="60" width="70" height="16" rx="6" fill="#ffffff" fillOpacity="0.2" />
                    <text x="30" y="70.5" fill="#ffffff" fontSize="7" fontFamily="sans-serif" fontWeight="bold">Bénéfice : +48 000 F</text>
                    
                    <text x="168" y="71" fill="#ffffff" fontSize="9" fontFamily="sans-serif" fontWeight="900">+12.4%</text>
                    <path d="M152 69l3-3 3 3 5-5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </g>

                  {/* Mini Sales Chart */}
                  <g transform="translate(16, 196)">
                    <rect x="10" y="0" width="208" height="96" rx="16" fill="#ffffff" stroke="#f1f5f9" strokeWidth="1" />
                    <text x="22" y="18" fill="#0f172a" fontSize="9" fontFamily="sans-serif" fontWeight="bold">Performance Hebdo</text>
                    
                    <line x1="22" y1="40" x2="206" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="22" y1="62" x2="206" y2="62" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="22" y1="84" x2="206" y2="84" stroke="#f1f5f9" strokeWidth="1" />
                    
                    {/* Graph bars */}
                    <rect x="34" y="68" width="14" height="16" rx="3" fill="#ea580c" fillOpacity="0.3" />
                    <rect x="58" y="52" width="14" height="32" rx="3" fill="#ea580c" fillOpacity="0.4" />
                    <rect x="82" y="44" width="14" height="40" rx="3" fill="#ea580c" fillOpacity="0.6" />
                    <rect x="106" y="32" width="14" height="52" rx="3" fill="#ea580c" fillOpacity="0.8" />
                    <rect x="130" y="24" width="14" height="60" rx="3" fill="#ea580c" />
                    <rect x="154" y="28" width="14" height="56" rx="3" fill="#ea580c" />
                    <rect x="178" y="18" width="14" height="66" rx="3" fill="#f97316" />
                  </g>

                  {/* Live Transactions List */}
                  <g transform="translate(16, 304)">
                    <rect x="10" y="0" width="208" height="106" rx="16" fill="#ffffff" stroke="#f1f5f9" strokeWidth="1" />
                    <text x="22" y="18" fill="#0f172a" fontSize="9" fontFamily="sans-serif" fontWeight="bold">Dernières Activités</text>
                    
                    {/* Row 1 */}
                    <g transform="translate(12, 28)">
                      <rect x="10" y="0" width="184" height="32" rx="10" fill="#f8fafc" />
                      <circle cx="24" cy="16" r="8" fill="#ffedd5" />
                      <path d="M22 13v6M20 16h8" stroke="#ea580c" strokeWidth="1.2" strokeLinecap="round" />
                      <text x="38" y="15" fill="#0f172a" fontSize="8" fontFamily="sans-serif" fontWeight="bold">Vente #8843</text>
                      <text x="38" y="23" fill="#64748b" fontSize="6.5" fontFamily="sans-serif">Mamadou S. • Dakar</text>
                      <text x="142" y="20" fill="#16a34a" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold">+45 000 F</text>
                    </g>

                    {/* Row 2 */}
                    <g transform="translate(12, 64)">
                      <rect x="10" y="0" width="184" height="32" rx="10" fill="#f8fafc" />
                      <circle cx="24" cy="16" r="8" fill="#fee2e2" />
                      <path d="M20 16h8" stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round" />
                      <text x="38" y="15" fill="#0f172a" fontSize="8" fontFamily="sans-serif" fontWeight="bold">Achat Stock #01</text>
                      <text x="38" y="23" fill="#64748b" fontSize="6.5" fontFamily="sans-serif">Grossiste Sodida</text>
                      <text x="142" y="20" fill="#dc2626" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold">-28 000 F</text>
                    </g>
                  </g>

                  {/* Quick Navigation Panel */}
                  <g transform="translate(16, 422)">
                    <rect x="10" y="0" width="208" height="42" rx="14" fill="#ffffff" stroke="#f1f5f9" strokeWidth="1" />
                    {/* Navigation Icons */}
                    <circle cx="34" cy="21" r="10" fill="#ffedd5" />
                    <path d="M30 25v-6M38 25v-6" stroke="#ea580c" strokeWidth="1.2" />
                    <path d="M29 18l5-4 5 4" stroke="#ea580c" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M72 15h12v12H72z" stroke="#94a3b8" strokeWidth="1.2" strokeLinejoin="round" />
                    <circle cx="78" cy="21" r="2" fill="#94a3b8" />
                    <circle cx="122" cy="19" r="4" stroke="#94a3b8" strokeWidth="1.2" />
                    <path d="M116 26.5c0-2.5 2.5-4.5 6-4.5s6 2 6 4.5" stroke="#94a3b8" strokeWidth="1.2" />
                    <circle cx="166" cy="21" r="3" stroke="#94a3b8" strokeWidth="1.2" />
                    <circle cx="166" cy="21" r="1" fill="#94a3b8" />
                  </g>

                  {/* Home Indicator */}
                  <rect x="95" y="504" width="70" height="4" rx="2" fill="#cbd5e1" />

                  {/* Gradients definition */}
                  <defs>
                    <linearGradient id="phone-grad" x1="10" y1="4" x2="218" y2="90" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#ea580c" />
                      <stop offset="1" stopColor="#f97316" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* QR Code and demo panel */}
                <div className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl p-4 flex flex-col items-center text-center space-y-3 shadow-sm">
                  <span className="text-[8.5px] font-black uppercase tracking-widest text-orange-600 bg-orange-100/50 px-2.5 py-0.5 rounded-md">
                    Version Démo Directe
                  </span>
                  
                  <div className="bg-white p-2 rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-center">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code de test" 
                      className="w-20 h-20 object-contain"
                      crossOrigin="anonymous"
                    />
                  </div>
                  
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-zinc-900 leading-tight">
                      Scannez pour tester immédiatement
                    </p>
                    <p className="text-[8.5px] text-zinc-400 font-bold">
                      Accès direct depuis votre mobile
                    </p>
                  </div>
                </div>

              </div>

            </div>

            {/* 3. FOOTER CTA SECTION */}
            <div className="border-t border-zinc-100 pt-6 flex flex-col gap-4 relative z-10">
              <div className="flex items-center justify-between bg-zinc-950 text-white rounded-2xl p-4 pl-6 shadow-xl">
                
                {/* Contacts Block */}
                <div className="flex items-center gap-6 text-[11px] font-extrabold">
                  <a 
                    href="https://wa.me/221773831364" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 hover:text-orange-400 transition-colors"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <WhatsAppIcon className="h-3.5 w-3.5" />
                    </span>
                    <span>+221 77 383 13 64</span>
                  </a>

                  <a 
                    href="mailto:dionemhd1@gmail.com" 
                    className="flex items-center gap-2 hover:text-orange-400 transition-colors"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
                      <Mail className="h-3.5 w-3.5" />
                    </span>
                    <span>dionemhd1@gmail.com</span>
                  </a>
                </div>

                {/* Web Url badge */}
                <div className="flex items-center gap-2 text-[11px] font-black bg-orange-600/15 border border-orange-500/20 px-4 py-1.5 rounded-xl">
                  <span className="text-orange-400 uppercase tracking-widest text-[8px] font-extrabold">Web</span>
                  <span className="text-white tracking-wide">gestion-pro.vercel.app</span>
                </div>
              </div>

              {/* Bottom legal text */}
              <div className="flex items-center justify-between text-[8px] text-zinc-400 font-extrabold uppercase tracking-widest px-1">
                <span>Disponible prochainement en version stable</span>
                <span>© {new Date().getFullYear()} GestionPro • Test Privé uniquement</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── GLOBAL PRINT & PREVIEW STYLES ─────────────────────────────────────── */}
      <style jsx global>{`
        /* Screen media layout scaling & margins */
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
        
        /* Print media layout sizes */
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
            padding: 20mm !important; /* Premium printed borders */
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            overflow: hidden !important;
          }
        }
      `}</style>

    </div>
  );
}
