 
"use client";

import { Smartphone, Store, Check, Sparkles } from "lucide-react";
import { Section, SectionHeader } from "./section";
 
import { motion } from "framer-motion";

type Persona = {
  icon: typeof Smartphone;
  title: string;
  baseline: string;
  bullets: string[];
};

const personas: Persona[] = [
  {
    icon: Smartphone,
    title: "L'entrepreneur tech-savvy",
    baseline: "25-35 ans · gère 1 à 3 boutiques · digital native",
    bullets: [
      "Expérience mobile-first fluide",
      "Marketplace pour toucher de nouveaux clients",
      "Analyses de données automatisées",
      "Multi-utilisateurs et rôles précis",
    ],
  },
  {
    icon: Store,
    title: "Le commerçant traditionnel",
    baseline: "35-55 ans · 1 boutique physique · expert métier",
    bullets: [
      "Interface POS ultra-simplifiée",
      "Gestion clients et fidélité intuitive",
      "Inventaire visuel sans jargon",
      "Support dédié et accompagnement local",
    ],
  },
];

export function Personas() {
  return (
    <Section id="pour-qui" tone="default" size="lg">
      <SectionHeader
        eyebrow="Pour qui"
        title={
          <>
            Pensé pour <span className="text-shimmer">tous les commerçants.</span>
          </>
        }
        subtitle="Que vous soyez un expert du digital ou un commerçant traditionnel, notre solution s'adapte à votre expertise."
      />

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        {personas.map((p, i) => {
          const Icon = p.icon;
          return (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative overflow-hidden rounded-[2.5rem] border border-border bg-card/40 p-8 md:p-12 transition-all duration-500 hover:-translate-y-2 hover:border-brand/40 group shadow-lg hover:shadow-2xl"
            >
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand group-hover:scale-110 transition-transform">
                    <Icon className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground">{p.title}</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                      {p.baseline}
                    </p>
                  </div>
                </div>

                <ul className="space-y-4">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-4">
                      <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-success/10 text-success">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </div>
                      <span className="text-foreground/80 font-medium">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10 pt-8 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
                  <Sparkles className="w-4 h-4 text-brand" />
                  Solution Sur-Mesure
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
