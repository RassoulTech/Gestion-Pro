"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { AnimatedCounter } from "./animated-counter";

type Stat = {
  display: React.ReactNode;
  label: string;
};

export function SocialProof() {
  const t = useTranslations("landing.socialProof");
  const stats: Stat[] = [
    {
      display: <AnimatedCounter value={500} suffix="+" duration={2} />,
      label: t("merchants"),
    },
    {
      display: <AnimatedCounter value={3} duration={1} />,
      label: t("countries"),
    },
    {
      display: <AnimatedCounter value={99.9} decimals={1} suffix="%" duration={2} />,
      label: t("uptime"),
    },
    {
      display: <span>2min</span>,
      label: t("onboarding"),
    },
  ];
  return (
    <div className="relative overflow-hidden border-y border-border/50 bg-background/50 backdrop-blur-md">
      <div className="container-app py-12 md:py-16">
        <p className="text-label-upper text-center mb-10 opacity-60">
          {t("trust")}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((s, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center group"
            >
              <div className="text-3xl md:text-4xl font-black tracking-tighter text-foreground mb-2 group-hover:text-brand transition-colors tabular-nums">
                {s.display}
              </div>
              <div className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Decorative gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-linear-to-r from-transparent via-brand/20 to-transparent" />
    </div>
  );
}
