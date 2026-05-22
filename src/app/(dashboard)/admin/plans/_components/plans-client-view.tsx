"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Check, Flame, ShieldCheck, Star, Sparkles, HelpCircle } from "lucide-react";

interface Plan {
  id: string;
  nom: string;
  prix: number;
  maxBoutiques: number;
  maxProduits: number;
  dureeEssaiJours: number;
  actif: boolean;
}

interface PlansClientViewProps {
  plans: Plan[];
}

function getPlanDesign(nomPlan: string) {
  const name = nomPlan.toLowerCase();
  if (name.includes("pro") || name.includes("premium") || name.includes("gold") || name.includes("avance")) {
    return {
      gradient: "from-cyan-500/10 via-indigo-500/5 to-transparent",
      accentBorder: "border-cyan-500/40 dark:border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)]",
      textClass: "text-slate-950 dark:text-slate-50",
      badgeColor: "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white border-none shadow-[0_0_12px_rgba(6,182,212,0.4)]",
      icon: Flame,
      iconColor: "text-cyan-500 dark:text-cyan-400",
      bgGlow: "bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20",
      popular: true,
    };
  }
  if (name.includes("gratuit") || name.includes("free") || name.includes("essai") || name.includes("basic")) {
    return {
      gradient: "from-slate-500/5 to-transparent",
      accentBorder: "border-slate-200/50 dark:border-slate-700/60",
      textClass: "text-slate-950 dark:text-slate-50",
      badgeColor: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/50 dark:border-slate-700",
      icon: ShieldCheck,
      iconColor: "text-slate-500 dark:text-slate-400",
      bgGlow: "bg-slate-500/5",
      popular: false,
    };
  }
  return {
    gradient: "from-indigo-500/5 via-violet-500/2 to-transparent",
    accentBorder: "border-indigo-500/20 dark:border-indigo-800/40 shadow-[0_0_15px_rgba(99,102,241,0.05)]",
    textClass: "text-slate-950 dark:text-slate-50",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30",
    icon: Star,
    iconColor: "text-indigo-500 dark:text-indigo-400",
    bgGlow: "bg-indigo-500/10",
    popular: false,
  };
}

export function PlansClientView({ plans }: PlansClientViewProps) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan, index) => {
        const design = getPlanDesign(plan.nom);
        const PlanIcon = design.icon;

        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className={`relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-white/70 p-8 shadow-xl backdrop-blur-xl dark:bg-slate-900/70 transition-all duration-300 ${design.accentBorder}`}
          >
            {/* Background Glow Effect */}
            <div className={`absolute -right-16 -top-16 h-36 w-36 rounded-full ${design.bgGlow} blur-3xl opacity-60`} />

            {/* Popular/Featured Banner */}
            {design.popular && (
              <div className="absolute right-0 top-0 h-16 w-16 overflow-hidden">
                <div className="absolute top-3 right-[-31px] w-24 rotate-45 bg-gradient-to-r from-cyan-500 to-indigo-500 text-[9px] font-black text-center text-white py-1 uppercase tracking-wider shadow-md">
                  Recommandé
                </div>
              </div>
            )}

            <div>
              {/* Header section of the pricing card */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200/20 shadow-inner">
                    <PlanIcon className={`h-5 w-5 ${design.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
                      {plan.nom}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">
                      Tier #{index + 1}
                    </span>
                  </div>
                </div>
                {plan.actif ? (
                  <Badge variant="outline" className={`font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${design.badgeColor}`}>
                    Actif
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="rounded-lg text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5">
                    Inactif
                  </Badge>
                )}
              </div>

              {/* Pricing details */}
              <div className="mb-6 flex items-baseline">
                <span className="text-5xl font-black tracking-tight text-slate-950 dark:text-slate-50">
                  {formatCurrency(plan.prix)}
                </span>
                <span className="text-sm font-bold text-slate-400 dark:text-slate-500 ml-1.5">/ mois</span>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800/60 mb-6" />

              {/* Quotas & Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400 border border-cyan-100/50 dark:border-cyan-900/30">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {plan.maxBoutiques} {plan.maxBoutiques > 1 ? "boutiques autorisées" : "boutique autorisée"}
                  </span>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400 border border-cyan-100/50 dark:border-cyan-900/30">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Jusqu&apos;à <span className="font-extrabold text-slate-950 dark:text-slate-50">{plan.maxProduits}</span> produits
                  </span>
                </div>

                {plan.dureeEssaiJours > 0 && (
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400 border border-cyan-100/50 dark:border-cyan-900/30">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {plan.dureeEssaiJours} jours d&apos;essai gratuit
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom metadata / call to action preview */}
            <div className="mt-auto pt-4 border-t border-dashed border-slate-100 dark:border-slate-800/60">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <span>Auto-renouvelable</span>
                <HelpCircle className="h-4 w-4 text-slate-300 dark:text-slate-700" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
