"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader } from "./section";
import { cn } from "@/lib/utils";
import { formatPrice, type Currency } from "@/lib/format";
import { PLAN_LIST } from "@/lib/plan-limits";

import { motion } from "framer-motion";

type Plan = {
  name: string;
  monthlyXOF: number | null;
  description: string;
  features: string[];
  cta: { label: string; href: string };
  highlight?: boolean;
};

const EASE = [0.16, 1, 0.3, 1] as const;

const plans: Plan[] = PLAN_LIST.map((p) => ({
  name: p.nom,
  monthlyXOF: p.prix,
  description: p.shortDescription,
  features: p.features,
  cta: {
    label:
      p.code === "STARTER"
        ? "Essayer gratuitement"
        : `Choisir ${p.nom}`,
    href: "/register",
  },
  highlight: p.code === "PRO",
}));

const XOF_PER_EUR = 655.957;

export function PricingSection() {
  const [currency, setCurrency] = React.useState<Currency>("XOF");
  const [billingInterval, setBillingInterval] = React.useState<"monthly" | "yearly">("monthly");

  const XOF_PER_EUR = 655.957;
  const XOF_PER_USD = 600;

  function displayPrice(plan: Plan): { value: string; originalValue?: string; suffix: string } {
    if (plan.monthlyXOF === null) return { value: "Sur devis", suffix: "" };
    if (plan.monthlyXOF === 0) return { value: "Gratuit", suffix: "" };

    let priceVal = plan.monthlyXOF;
    if (currency === "EUR") {
      priceVal = plan.monthlyXOF / XOF_PER_EUR;
    } else if (currency === "USD") {
      priceVal = plan.monthlyXOF / XOF_PER_USD;
    }

    if (billingInterval === "yearly") {
      const discounted = priceVal * 0.8;
      return {
        value: formatPrice(discounted, currency),
        originalValue: formatPrice(priceVal, currency),
        suffix: "/ mois"
      };
    }

    return {
      value: formatPrice(priceVal, currency),
      suffix: "/ mois"
    };
  }

  return (
    <Section id="tarifs" tone="default" size="xl" className="relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none" />

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

      {/* Switchers */}
      <div className="mt-12 flex flex-col items-center gap-4">
        {/* Currencies Toggle */}
        <div className="inline-flex p-1 bg-zinc-900/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 shadow-xl">
          {(["XOF", "USD", "EUR"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={cn(
                "px-5 py-2 rounded-xl text-xs font-black transition-all duration-300",
                currency === c
                  ? "bg-brand text-white shadow-lg shadow-brand/25"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Interval Toggle */}
        <div className="inline-flex p-1 bg-zinc-900/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 shadow-xl items-center">
          <button
            type="button"
            onClick={() => setBillingInterval("monthly")}
            className={cn(
              "px-5 py-2 rounded-xl text-xs font-black transition-all duration-300",
              billingInterval === "monthly"
                ? "bg-brand text-white shadow-lg shadow-brand/25"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval("yearly")}
            className={cn(
              "px-5 py-2 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1.5",
              billingInterval === "yearly"
                ? "bg-brand text-white shadow-lg shadow-brand/25"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <span>Annuel</span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] font-black border border-emerald-500/20">
              -20%
            </span>
          </button>
        </div>

        {/* Annual discount highlights */}
        {billingInterval === "yearly" && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
          >
            <span>🎉 Économisez jusqu&apos;à {currency === "XOF" ? "47 760 FCFA" : currency === "EUR" ? "72,80 €" : "79,60 $"} / an !</span>
          </motion.div>
        )}
      </div>

      <div className="mt-10 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch z-10 relative">
        {plans.map((plan, i) => {
          const { value, originalValue, suffix } = displayPrice(plan);
          const isHighlight = !!plan.highlight;

          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: EASE, delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className={cn(
                "relative flex flex-col p-6 sm:p-8 rounded-3xl border transition-all duration-500 backdrop-blur-xl shadow-lg",
                isHighlight
                  ? "border-orange-600/50 dark:border-orange-500/50 bg-white/70 dark:bg-zinc-900/70 shadow-xl shadow-orange-600/[0.03] lg:scale-105 z-10"
                  : "border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700/80 hover:shadow-xl"
              )}
            >
              {isHighlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-600 to-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-orange-600/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  Recommandé
                </div>
              )}

              {/* Glowing decorative background for Highlighted card */}
              {isHighlight && (
                <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-30 transition-opacity duration-700 z-0 bg-radial-gradient bg-gradient-to-b from-orange-600/10 to-transparent rounded-3xl" />
              )}

              <div className="mb-8 relative z-10">
                <h3 className={cn(
                  "text-xl font-extrabold mb-2",
                  isHighlight ? "text-orange-600 dark:text-orange-400" : "text-zinc-900 dark:text-zinc-50"
                )}>{plan.name}</h3>
                <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 leading-relaxed">{plan.description}</p>
              </div>

              <div className="mb-8 flex flex-col justify-end min-h-[4.5rem] relative z-10">
                {originalValue && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-zinc-500 line-through tabular-nums">
                      {originalValue}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] font-black border border-emerald-500/20">
                      -20%
                    </span>
                  </div>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 tabular-nums">
                    {value}
                  </span>
                  {suffix && (
                    <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{suffix}</span>
                  )}
                </div>
              </div>

              <ul className="flex-1 space-y-4 mb-8 relative z-10">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    <div className={cn(
                      "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 border",
                      isHighlight
                        ? "bg-orange-600/10 border-orange-500/20 text-orange-600 dark:text-orange-400"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    )}>
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </div>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="xl"
                variant={isHighlight ? "brand" : "outline"}
                className={cn(
                  "w-full rounded-2xl font-black text-base h-14 transition-all active-press relative z-10",
                  isHighlight 
                    ? "bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-600/20 border-none" 
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
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
