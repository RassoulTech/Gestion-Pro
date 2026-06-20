"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Store } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/brand-icons";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const EASE = [0.16, 1, 0.3, 1] as const;

const WORDS = [
  "Gérez votre commerce.",
  "Développez votre activité.",
  "Automatisez vos ventes.",
  "Pilotez votre stock.",
  "Centralisez vos boutiques.",
  "Faites grandir votre entreprise.",
];

export function Hero() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [wordIdx, setWordIdx] = React.useState(0);

  // Cycle through phrases
  React.useEffect(() => {
    const interval = setInterval(() => {
      setWordIdx((prev) => (prev + 1) % WORDS.length);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  // Parallax effects
  const y1 = useTransform(scrollY, [0, 500], [0, -80]);
  const y2 = useTransform(scrollY, [0, 500], [0, -40]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative isolate min-h-[95vh] flex flex-col items-center justify-center pt-32 pb-24 overflow-hidden bg-background"
    >
      {/* ─── Premium Background Elements ─── */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none">
        {/* Subtle grid with radial mask */}
        <svg
          className="absolute inset-0 w-full h-full stroke-zinc-200/40 dark:stroke-zinc-800/30 [mask-image:radial-gradient(80%_80%_at_50%_40%,white,transparent)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="hero-grid"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
              x="50%"
            >
              <path d="M.5 50V.5H50" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>

        {/* Ambient Blur Blobs with Slow Random Motion */}
        <motion.div
          style={{ y: y1, opacity }}
          animate={{
            x: [0, 30, -30, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.05, 0.95, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-1/2 top-[-10%] -translate-x-1/2 w-[600px] sm:w-[800px] h-[500px] bg-brand/10 dark:bg-brand/5 blur-[120px] rounded-full"
        />
        
        <motion.div
          style={{ y: y2, opacity }}
          animate={{
            x: [0, -40, 40, 0],
            y: [0, 30, -30, 0],
            scale: [1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute right-[5%] top-[20%] w-[300px] sm:w-[500px] h-[400px] bg-blue-500/10 dark:bg-blue-500/5 blur-[110px] rounded-full"
        />

        {/* Subtly superimpose base64 SVG grain noise */}
        <div
          className="absolute inset-0 opacity-[0.012] dark:opacity-[0.022] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* ─── Hero Content ─── */}
      <div className="container-app relative z-10 w-full">
        <div className="mx-auto max-w-5xl text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 p-1.5 pr-4 text-xs font-semibold backdrop-blur-md shadow-md shadow-black/[0.02] transition-all hover:border-orange-500/30 hover:shadow-lg cursor-default group"
          >
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-sm shadow-orange-500/10">
              Nouveau
            </span>
            <span className="text-zinc-700 dark:text-zinc-300 font-bold px-0.5">
              Conçu pour les entreprises d&apos;Afrique
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
          </motion.div>

          {/* Headline with animated rotation & reveal */}
          <h1 className="text-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tight text-foreground font-black leading-[1.05] select-none text-center">
            <span className="block overflow-hidden pb-1">
              <motion.span
                initial={{ opacity: 0, y: "80%" }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: EASE, delay: 0.1 }}
                className="block text-zinc-950 dark:text-white"
              >
                L&apos;intelligence commerciale
              </motion.span>
            </span>
            <span className="block min-h-[1.25em] py-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIdx}
                  initial={{ opacity: 0, y: 35 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -35 }}
                  transition={{ duration: 0.55, ease: EASE }}
                  className="block text-shimmer bg-clip-text text-transparent"
                >
                  {WORDS[wordIdx]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
            className="mx-auto mt-8 max-w-3xl text-base sm:text-lg md:text-xl text-muted-foreground/90 leading-relaxed font-medium"
          >
            GestionPro unifie la gestion de stock en temps réel, la facturation intelligente, le suivi financier et le pilotage multi-boutiques. Une plateforme moderne, ultra-rapide et sécurisée pour propulser votre entreprise.
          </motion.p>

          {/* Call to Actions with glow effects */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.5 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
          >
            <Button
              asChild
              size="xl"
              variant="brand"
              className="group relative overflow-hidden px-8 h-14 text-lg rounded-2xl w-full sm:w-auto shadow-[0_0_20px_rgba(234,88,12,0.12)] hover:shadow-[0_0_35px_rgba(234,88,12,0.35)] transition-all duration-300 active:scale-[0.98] active-press cursor-pointer"
            >
              <Link href="/register">
                <span className="relative z-10 flex items-center justify-center gap-2 font-black">
                  Démarrer gratuitement
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity animate-shimmer-bg" />
              </Link>
            </Button>
            
            <Button
              asChild
              size="xl"
              variant="outline"
              className="px-8 h-14 text-lg rounded-2xl w-full sm:w-auto glass hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:shadow-[0_0_25px_rgba(255,255,255,0.05)] transition-all duration-300 active:scale-[0.98] active-press cursor-pointer font-bold"
            >
              <Link href="/marketplace">Voir la démo</Link>
            </Button>
          </motion.div>

          {/* Premium Trust Cards Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.65 }}
            className="mt-24 w-full max-w-4xl"
          >
            <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-6 text-center">
              Plateforme commerciale de confiance
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
              {[
                {
                  icon: Zap,
                  label: "Synchronisation temps réel",
                  desc: "Mises à jour instantanées de vos stocks, commandes et flux financiers.",
                  color: "group-hover:text-amber-500",
                  bg: "group-hover:bg-amber-500/5",
                  border: "group-hover:border-amber-500/20",
                },
                {
                  icon: Store,
                  label: "Multi-boutiques",
                  desc: "Pilotez et centralisez plusieurs points de vente depuis une seule interface.",
                  color: "group-hover:text-blue-500",
                  bg: "group-hover:bg-blue-500/5",
                  border: "group-hover:border-blue-500/20",
                },
                {
                  icon: WhatsAppIcon,
                  label: "Reçus par WhatsApp",
                  desc: "Générez et envoyez instantanément des reçus de caisse certifiés à vos clients.",
                  color: "group-hover:text-emerald-500",
                  bg: "group-hover:bg-emerald-500/5",
                  border: "group-hover:border-emerald-500/20",
                },
              ].map(({ icon: Icon, label, desc, color, bg, border }) => (
                <div
                  key={label}
                  className="group flex flex-col p-6 rounded-2xl border border-border/40 bg-card/40 dark:bg-card/25 backdrop-blur-md shadow-xs hover:bg-card/80 dark:hover:bg-card/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-sm"
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-muted border border-border text-muted-foreground mb-4 transition-all duration-300 ${bg} ${border} ${color}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-sm font-black text-foreground mb-1.5 transition-colors group-hover:text-zinc-950 dark:group-hover:text-white">
                    {label}
                  </h3>
                  <p className="text-xs text-muted-foreground/80 font-medium leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
