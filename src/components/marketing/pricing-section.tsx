/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader } from "./section";
import { cn } from "@/lib/utils";
import { formatPrice, type Currency } from "@/lib/format";
 
import { motion, AnimatePresence } from "framer-motion";

type Plan = {
  name: string;
  monthlyXOF: number | null;
  description: string;
  features: string[];
  cta: { label: string; href: string };
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter",
    monthlyXOF: 0,
    description: "Pour démarrer et tester sans engagement.",
    features: [
      "1 boutique maximum",
      "50 produits maximum",
      "POS simple",
      "Stock basique",
      "Support par email",
    ],
    cta: { label: "Essayer gratuitement", href: "/register" },
  },
  {
    name: "Pro",
    monthlyXOF: 9900,
    description: "Pour les commerces en pleine croissance.",
    features: [
      "Maximum 3 boutiques",
      "Jusqu'à 500 produits",
      "POS avancé",
      "Ventes flash",
      "Stock avancé & mouvements",
      "Rapports détaillés & exports",
      "Mini-marketplace public",
      "Support prioritaire",
    ],
    cta: { label: "Choisir Pro", href: "/register" },
    highlight: true,
  },
  {
    name: "Enterprise",
    monthlyXOF: 199000,
    description: "Pour les réseaux de boutiques et multi-équipes.",
    features: [
      "Boutiques illimitées",
      "Produits illimités",
      "Rôles & permissions avancés",
      "Multi-utilisateurs & équipes",
      "API & automatisations",
      "Analytics & rapports premium",
      "SLA & support dédié 24/7",
    ],
    cta: { label: "Choisir Enterprise", href: "/register" },
  },
];

const XOF_PER_EUR = 655.957;

export function PricingSection() {
  const [currency, setCurrency] = React.useState<Currency>("XOF");

  function displayPrice(plan: Plan): { value: string; suffix: string } {
    if (plan.monthlyXOF === null) return { value: "Sur devis", suffix: "" };
    if (plan.monthlyXOF === 0) return { value: "Gratuit", suffix: "14 jours" };
    const value =
      currency === "XOF"
        ? formatPrice(plan.monthlyXOF, "XOF")
        : formatPrice(plan.monthlyXOF / XOF_PER_EUR, "EUR");
    return { value, suffix: "/ mois" };
  }

  return (
    <Section id="tarifs" tone="default" size="xl">
      <SectionHeader
        eyebrow="Tarification"
        title={
          <>
            Un investissement, <br />
            <span className="text-shimmer">pas une dépense.</span>
          </>
        }
        subtitle="Choisissez le plan qui correspond à la taille de votre ambition. Sans engagement."
      />

      {/* Currency Switcher */}
      <div className="mt-12 flex justify-center">
        <div className="inline-flex p-1 bg-foreground/5 rounded-2xl backdrop-blur-md border border-border">
          {(["XOF", "EUR"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                currency === c
                  ? "bg-foreground text-background shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {c === "XOF" ? "FCFA" : "Euro"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, i) => {
          const { value, suffix } = displayPrice(plan);
          const isHighlight = !!plan.highlight;

          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn(
                "relative flex flex-col p-8 rounded-3xl border transition-all duration-500",
                isHighlight 
                  ? "border-brand bg-card shadow-2xl shadow-brand/10 scale-105 z-10" 
                  : "border-border bg-card/50 hover:border-foreground/20"
              )}
            >
              {isHighlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-brand/20">
                  <Sparkles className="w-3 h-3" />
                  Recommandé
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tighter text-foreground tabular-nums">
                  {value}
                </span>
                <span className="text-sm font-medium text-muted-foreground">{suffix}</span>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-success" strokeWidth={3} />
                    </div>
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="xl"
                variant={isHighlight ? "brand" : "outline"}
                className={cn(
                  "w-full rounded-2xl font-bold h-14 transition-all active-press",
                  isHighlight && "shadow-lg shadow-brand/20"
                )}
              >
                <Link href={plan.cta.href as never}>{plan.cta.label}</Link>
              </Button>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
