/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
 
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
 
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  
  // Parallax effects
  const y1 = useTransform(scrollY, [0, 500], [0, -100]);
  const y2 = useTransform(scrollY, [0, 500], [0, -50]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
 
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);

  return (
    <section 
      ref={containerRef} 
      className="relative isolate min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden"
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div 
          style={{ y: y1, opacity }}
          className="absolute left-1/2 top-0 -translate-x-1/2 w-[1000px] h-[600px] bg-brand/10 blur-[120px] rounded-full dark:bg-brand/5" 
        />
        <motion.div 
          style={{ y: y2, opacity }}
          className="absolute right-0 top-1/4 w-[400px] h-[400px] bg-info/10 blur-[100px] rounded-full dark:bg-info/5" 
        />
      </div>

      <div className="container-app relative z-10">
        <div className="mx-auto max-w-5xl text-center">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-5 py-2 text-xs font-bold text-brand backdrop-blur-md uppercase tracking-wider shadow-sm"
          >
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span>L&apos;EXCELLENCE COMMERCIALE SANS COMPROMIS</span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-display text-5xl md:text-7xl lg:text-8xl tracking-tight text-foreground font-black leading-[1.08] select-none">
            <span className="block overflow-hidden pb-1">
              <motion.span
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: EASE, delay: 0.1 }}
                className="block"
              >
                L&apos;intelligence commerciale
              </motion.span>
            </span>
            <span className="block overflow-hidden py-1">
              <motion.span
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: EASE, delay: 0.25 }}
                className="block text-shimmer"
              >
                redéfinie pour l&apos;Afrique.
              </motion.span>
            </span>
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.4 }}
            className="mx-auto mt-8 max-w-3xl text-lg md:text-xl text-muted-foreground/90 leading-relaxed font-normal"
          >
            GestionPro unifie la gestion de stock en temps réel, la facturation certifiée, le suivi financier de pointe et la synchronisation multi-boutiques. 
            Une plateforme ultra-rapide, moderne et sécurisée, conçue pour propulser l&apos;élite des entrepreneurs.
          </motion.p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.55 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button asChild size="xl" variant="brand" className="group relative overflow-hidden px-8 h-14 text-lg">
              <Link href="/register">
                <span className="relative z-10 flex items-center gap-2">
                  Démarrer gratuitement
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity animate-shimmer-bg" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="px-8 h-14 text-lg glass">
              <Link href="/marketplace">Voir la démo</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
