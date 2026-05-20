"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const EASE = [0.16, 1, 0.3, 1] as const;

export function CTAFinal() {
  return (
    <section className="relative isolate py-24 sm:py-32 overflow-hidden">
      {/* Background with mesh-like glow */}
      <div className="absolute inset-0 -z-10 bg-foreground dark:bg-card overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-linear-to-br from-brand/20 via-transparent to-info/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: EASE }}
        className="container-app relative z-10"
      >
        <div className="mx-auto max-w-4xl rounded-[2rem] sm:rounded-[3rem] border border-white/5 bg-white/2 backdrop-blur-3xl p-6 sm:p-12 md:p-20 text-center shadow-2xl">
          <div className="mb-6 sm:mb-8 inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-xs font-bold text-brand uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            C&apos;est le moment
          </div>

          <h2 className="text-display text-3xl sm:text-4xl md:text-6xl tracking-tight text-white mb-6">
            Prêt à transformer <br />
            votre <span className="text-shimmer">commerce ?</span>
          </h2>
          
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/60 leading-relaxed">
            Rejoignez des centaines de commerçants qui ont déjà digitalisé leur activité avec GestionPro.
            Pas de carte bancaire, pas d&apos;engagement.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="xl" variant="brand" className="h-14 px-8 rounded-2xl text-lg font-bold shadow-xl shadow-brand/20 active-press group">
              <Link href="/register">
                Démarrer gratuitement
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="ghost" className="h-14 px-8 rounded-2xl text-lg font-bold text-white hover:bg-white/5 border border-white/10">
              <Link href="/marketplace">Explorer la démo</Link>
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-8 text-white/40 text-sm font-medium">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              Installation rapide
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              Support 7j/7
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
