"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { renewCurrentSubscription } from "@/server/actions/subscription.actions";
import { RefreshCw, CreditCard, Zap } from "lucide-react";
import { WaveIcon, OrangeMoneyIcon } from "@/components/icons/brand-icons";

type RenewMethod = "WAVE" | "ORANGE_MONEY" | "STRIPE";

interface RenewSubscriptionButtonProps {
  planName: string;
  amount: number;
  urgent?: boolean;
}

const METHOD_LABEL: Record<RenewMethod, { label: string; sub: string; icon: React.ReactNode }> = {
  WAVE: {
    label: "Wave",
    sub: "Mobile Money",
    icon: <WaveIcon className="h-5 w-5 rounded" />,
  },
  ORANGE_MONEY: {
    label: "Orange Money",
    sub: "Mobile Money",
    icon: <OrangeMoneyIcon className="h-5 w-5 rounded" />,
  },
  STRIPE: {
    label: "Carte bancaire",
    sub: "Stripe (renouvellement automatique)",
    icon: <CreditCard className="h-5 w-5" />,
  },
};

export function RenewSubscriptionButton({
  planName,
  amount,
  urgent = false,
}: RenewSubscriptionButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<RenewMethod | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePick = async (method: RenewMethod) => {
    try {
      setLoading(method);
      setError(null);

      const result = await renewCurrentSubscription({ method });

      if (result?.data?.paymentUrl) {
        window.location.href = result.data.paymentUrl;
      } else {
        throw new Error(
          result?.serverError ||
            "Impossible d'initialiser le renouvellement. Réessayez."
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      console.error("Renewal error:", err);
      setError(message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={urgent ? "destructive" : "brand"}
          className={`w-full sm:w-auto h-12 rounded-xl font-black shadow-lg ${
            urgent
              ? "shadow-rose-500/30 animate-pulse"
              : "shadow-brand/20 hover:scale-[1.02] transition-transform"
          }`}
        >
          <Zap className="mr-2 h-4 w-4" />
          Renouveler maintenant
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black tracking-tight">
            Renouveler {planName}
          </DialogTitle>
          <DialogDescription className="text-sm font-semibold text-muted-foreground">
            Choisissez votre moyen de paiement pour réactiver votre forfait à{" "}
            <span className="font-black text-foreground">
              {amount.toLocaleString("fr-FR")} FCFA
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {(Object.keys(METHOD_LABEL) as RenewMethod[]).map((method) => {
            const meta = METHOD_LABEL[method];
            const isLoading = loading === method;
            const anyLoading = loading !== null;
            return (
              <button
                key={method}
                onClick={() => handlePick(method)}
                disabled={anyLoading}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-brand hover:bg-brand/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="h-10 w-10 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                  {isLoading ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    meta.icon
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm">{meta.label}</p>
                  <p className="text-xs text-muted-foreground font-semibold">
                    {meta.sub}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3">
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
              {error}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
