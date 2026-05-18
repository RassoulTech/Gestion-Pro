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
        <div className="mx-auto max-w-4xl text-center">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5 text-xs font-bold text-brand backdrop-blur-md uppercase tracking-widest"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>L&apos;excellence au service de votre commerce</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
            className="text-display text-5xl md:text-7xl lg:text-8xl tracking-tight text-foreground"
          >
            Maîtrisez chaque <br />
            <span className="text-shimmer">détail.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
            className="mx-auto mt-8 max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed font-medium"
          >
            L&apos;écosystème ultime pour les commerçants visionnaires. 
            Gérez vos boutiques, analysez vos performances et dominez votre marché avec une simplicité déconcertante.
          </motion.p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}
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
