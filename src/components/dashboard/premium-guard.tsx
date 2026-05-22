"use client";

import { useState } from "react";
import { Lock, Sparkles, ArrowRight, ShieldCheck, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "./upgrade-modal";

interface PremiumGuardProps {
  children: React.ReactNode;
  currentPlanName: string;
  allowedPlans?: string[];
  featureName?: string;
  featureDescription?: string;
}

export function PremiumGuard({
  children,
  currentPlanName,
  allowedPlans = ["Pro", "Enterprise"],
  featureName = "Fonctionnalité Premium",
  featureDescription = "Cette fonctionnalité est exclusive aux abonnés Pro et Enterprise. Boostez votre boutique dès maintenant.",
}: PremiumGuardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const isAllowed = allowedPlans.some(
    (p) => p.toLowerCase() === currentPlanName.toLowerCase()
  );

  if (isAllowed) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full min-h-[350px] sm:min-h-[500px] rounded-3xl sm:rounded-[2.5rem] border border-zinc-150 dark:border-zinc-800 bg-white/40 dark:bg-zinc-950/40 overflow-hidden shadow-2xl flex items-center justify-center p-4 sm:p-12">
      {/* Blurred background preview of the protected page content */}
      <div className="absolute inset-0 filter blur-xl opacity-10 pointer-events-none select-none overflow-hidden scale-[0.98]">
        {children}
      </div>

      {/* Modern High-End Overlay Block */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-xl w-full bg-white dark:bg-zinc-900/90 rounded-2xl sm:rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/80 shadow-2xl p-6 sm:p-10 text-center space-y-4 sm:space-y-6 backdrop-blur-xl"
      >
        <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-brand to-slate-800 flex items-center justify-center text-white shadow-xl shadow-brand/10">
          <Lock className="h-7 w-7" />
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="h-3 w-3 text-brand" /> Option Premium
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-zinc-100">
            {featureName}
          </h3>
          <p className="text-slate-500 dark:text-zinc-400 text-sm sm:text-base leading-relaxed font-semibold">
            {featureDescription}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800 text-left space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
            Inclus dans les abonnements Pro :
          </p>
          <ul className="grid grid-cols-2 gap-2">
            {[
              "Rapports détaillés",
              "Boutiques multiples",
              "Ventes flash",
              "Marché public",
              "Export PDF / Excel",
              "Support prioritaire",
            ].map((item, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-300">
                <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" strokeWidth={3} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => setModalOpen(true)}
            size="lg"
            className="flex-1 h-14 rounded-2xl font-black text-sm bg-gradient-to-r from-brand to-slate-800 hover:from-brand/90 hover:to-slate-800/90 text-white shadow-xl shadow-brand/10 border-none"
          >
            Débloquer maintenant
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </motion.div>

      <UpgradeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
