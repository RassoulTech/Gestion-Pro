"use client";

import { Section, SectionHeader } from "./section";
import { cn, getInitials } from "@/lib/utils";
import { Quote } from "lucide-react";
import { motion } from "framer-motion";

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  location: string;
};

const testimonials: Testimonial[] = [
  {
    quote:
      "Avant GestionPro, je perdais 2 heures chaque soir à recompter le stock. Aujourd'hui, je ferme la boutique et tout est déjà calculé.",
    name: "Awa Traoré",
    role: "Gérante, Beauté d'Afrique",
    location: "Dakar, Sénégal",
  },
  {
    quote:
      "Le POS marche même quand la connexion est faible. Mes caissières ont été à l'aise en moins d'une journée.",
    name: "Amadou Diallo",
    role: "Propriétaire, Diallo Électronique",
    location: "Thiès, Sénégal",
  },
  {
    quote:
      "Avec 4 boutiques à suivre, j'avais besoin d'une vue d'ensemble claire. Les rapports m'évitent des allers-retours toute la journée.",
    name: "Mariam Koné",
    role: "Directrice, Réseau MK Cosmétiques",
    location: "Abidjan, Côte d'Ivoire",
  },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function Testimonials() {
  return (
    <Section id="temoignages" tone="default" size="lg" className="relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand/5 blur-[150px] rounded-full pointer-events-none" />

      <SectionHeader
        eyebrow="Témoignages"
        title="Ils gagnent du temps chaque jour."
        subtitle="Des commerçants comme vous, dans des contextes très différents — un même outil au quotidien."
      />

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 z-10 relative">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: EASE, delay: i * 0.1 }}
            className={cn(
              "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 p-8 shadow-lg hover:shadow-2xl hover:shadow-violet-600/[0.01]",
              "transition-all duration-500 ease-out hover:-translate-y-2 hover:border-zinc-300 dark:hover:border-zinc-700/80 backdrop-blur-xl",
              i === 2 && "sm:col-span-2 lg:col-span-1"
            )}
          >
            {/* Top gradient accent line that lights up on hover */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-600 via-emerald-500 to-sky-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
            
            {/* Quote Icon */}
            <div className="mb-6 text-violet-600/35 dark:text-violet-400/25 group-hover:text-violet-600 dark:group-hover:text-violet-400 group-hover:scale-110 transition-all duration-500 self-start">
              <Quote className="h-8 w-8 fill-current" />
            </div>

            <blockquote className="flex-1">
              <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300 font-semibold italic sm:text-[15px]">
                "{t.quote}"
              </p>
            </blockquote>

            <figcaption className="mt-6 flex items-center gap-3.5 border-t border-zinc-150 dark:border-zinc-800/60 pt-5 sm:mt-8 sm:pt-6">
              {/* Premium Gradient Ring Avatar */}
              <div className="p-[2px] rounded-full bg-gradient-to-tr from-violet-600 to-emerald-500 group-hover:rotate-6 transition-transform duration-500">
                <span
                  aria-hidden="true"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-950 text-xs font-black text-zinc-800 dark:text-zinc-200 border border-white/20"
                >
                  {getInitials(t.name)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                  {t.name}
                </p>
                <p className="line-clamp-2 break-words text-xs text-zinc-500 dark:text-zinc-400 font-semibold sm:line-clamp-1">
                  {t.role} · <span className="text-violet-600 dark:text-violet-400">{t.location}</span>
                </p>
              </div>
            </figcaption>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
