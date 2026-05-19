"use client";

import { useState } from "react";
import { Sparkles, AlertTriangle, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "./upgrade-modal";
import { cn } from "@/lib/utils";

interface UpgradeBannerProps {
  currentPlanName: string;
  essaiFin: Date | null;
  className?: string;
}

export function UpgradeBanner({ currentPlanName, essaiFin, className }: UpgradeBannerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const isStarter = currentPlanName.toLowerCase() === "starter";
  const isTrial = essaiFin !== null;

  let daysRemaining = 0;
  if (essaiFin) {
    const diffTime = new Date(essaiFin).getTime() - new Date().getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Display only if user is in trial or under Starter plan
  if (!isStarter && (!isTrial || daysRemaining <= 0)) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-brand/10 via-slate-500/5 to-transparent border border-brand/20 dark:border-brand/30 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md",
          className
        )}
      >
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
            {isTrial ? <AlertTriangle className="h-5 w-5 animate-bounce" /> : <Sparkles className="h-5 w-5" />}
          </div>
          <div>
            <h5 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100 flex items-center gap-1.5 justify-center sm:justify-start">
              {isTrial ? (
                <>Votre période d&apos;essai expire bientôt !</>
              ) : (
                <>Vous utilisez le forfait Starter gratuit</>
              )}
            </h5>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold mt-0.5">
              {isTrial ? (
                <>Il vous reste {daysRemaining} jours d&apos;essai gratuit. Passez au plan supérieur pour conserver vos accès.</>
              ) : (
                <>Débloquez les ventes flash, boutiques multiples, rapports avancés et POS illimité.</>
              )}
            </p>
          </div>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          size="sm"
          className="rounded-xl font-black text-xs px-4 h-10 bg-brand hover:bg-brand/90 text-white shadow-lg shadow-brand/10 shrink-0 self-stretch sm:self-auto"
        >
          Mettre à niveau
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </div>

      <UpgradeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

interface QuotaIndicatorProps {
  label: string;
  count: number;
  max: number;
  className?: string;
}

export function QuotaIndicator({ label, count, max, className }: QuotaIndicatorProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const isUnlimited = max >= 999999;
  const percentage = isUnlimited ? 0 : Math.min((count / max) * 100, 100);
  const isCloseToLimit = percentage >= 80;
  const isOverLimit = percentage >= 100;

  return (
    <>
      <div className={cn("p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/30 space-y-3", className)}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">{label}</span>
          <span className="text-xs font-black text-slate-800 dark:text-zinc-100">
            {count} / {isUnlimited ? "∞" : max}
          </span>
        </div>

        {!isUnlimited && (
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isOverLimit
                    ? "bg-red-500"
                    : isCloseToLimit
                    ? "bg-amber-500"
                    : "bg-brand"
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
            {isCloseToLimit && (
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[10px] text-amber-600 dark:text-amber-500 font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Proche de la limite
                </span>
                <button
                  onClick={() => setModalOpen(true)}
                  className="text-[10px] text-brand hover:underline font-black uppercase tracking-wider"
                >
                  Augmenter
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <UpgradeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

interface FeatureLockProps {
  children: React.ReactNode;
  allowedPlans?: string[];
  currentPlanName: string;
  featureName: string;
  className?: string;
}

export function FeatureLock({
  children,
  allowedPlans = ["Pro", "Enterprise"],
  currentPlanName,
  featureName: _featureName,
  className,
}: FeatureLockProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const isAllowed = allowedPlans.some(
    (p) => p.toLowerCase() === currentPlanName.toLowerCase()
  );

  if (isAllowed) {
    return <>{children}</>;
  }

  return (
    <>
      <div className={cn("relative group cursor-not-allowed", className)} onClick={() => setModalOpen(true)}>
        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand to-slate-800 rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-500" />
        
        {/* Lock Overlay Badge */}
        <div className="absolute top-2 right-2 z-10 h-6 w-6 rounded-lg bg-zinc-950/80 border border-white/10 flex items-center justify-center text-brand shadow backdrop-blur-sm">
          <Lock className="h-3 w-3" />
        </div>

        <div className="pointer-events-none select-none opacity-50 filter blur-[0.5px]">
          {children}
        </div>
      </div>

      <UpgradeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
