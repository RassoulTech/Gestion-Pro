"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Loader2, CreditCard, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { getPlansAction, initiatePlanSubscription } from "@/server/actions/subscription.actions";
import { toast } from "sonner";

type PlanType = {
  id: string;
  nom: string;
  prix: number;
  dureeEssaiJours: number;
  maxBoutiques: number;
  maxProduits: number;
  features: string[];
};

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"WAVE" | "ORANGE_MONEY" | "PAYPAL" | "STRIPE">("STRIPE");
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    setLoading(true);
    getPlansAction()
      .then((res) => {
        if (res?.data) {
          setPlans(res.data as PlanType[]);
        }
      })
      .catch(() => {
        toast.error("Impossible de récupérer les forfaits.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubscribe() {
    if (!selectedPlan) return;
    
    setLoading(true);
    try {
      const result = await initiatePlanSubscription({
        planId: selectedPlan.id,
        method: selectedMethod,
      });

      if (result?.serverError) {
        if (result.serverError.includes("connecté")) {
          toast.error("Veuillez vous connecter pour vous abonner.");
          router.push("/login?callbackUrl=/pricing");
        } else if (result.serverError.includes("permissions")) {
          toast.info("Créez d'abord votre profil vendeur pour souscrire à un plan.");
          router.push("/onboarding");
        } else {
          toast.error(result.serverError);
        }
        return;
      }

      if (result?.data?.paymentUrl) {
        toast.success("Redirection vers le simulateur de paiement...");
        router.push(result.data.paymentUrl);
      } else {
        toast.error("Une erreur est survenue lors de l'initialisation.");
      }
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-20 px-4 sm:px-6 relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-slate-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-16 relative z-10">
        {/* Title */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-black uppercase tracking-widest">
            <Sparkles className="h-3 w-3" /> Tarifs Simples & Transparents
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Choisissez le plan idéal
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto font-medium text-sm sm:text-base">
            Aucun frais caché. Mettez à niveau, rétrogradez ou annulez votre abonnement à tout moment directement depuis votre espace personnel.
          </p>
        </div>

        {loading && plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 text-brand animate-spin" />
            <p className="text-zinc-500 text-xs font-black uppercase tracking-wider">Chargement des forfaits...</p>
          </div>
        ) : step === 1 ? (
          /* STEP 1: Comparison Cards Grid */
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const isPro = plan.nom === "Pro";
              const isEnterprise = plan.nom === "Enterprise";

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className={cn(
                    "relative p-8 rounded-[2.5rem] border bg-zinc-900/50 backdrop-blur-xl flex flex-col justify-between space-y-8",
                    isPro
                      ? "border-brand shadow-2xl shadow-brand/10 md:scale-105 z-10"
                      : isEnterprise
                      ? "border-zinc-400/50 shadow-2xl shadow-zinc-400/5"
                      : "border-zinc-800"
                  )}
                >
                  {isPro && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full text-white shadow-lg">
                      Le plus populaire
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-xl font-extrabold text-zinc-100">{plan.nom}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">
                        {plan.prix === 0 ? "Gratuit" : `${plan.prix.toLocaleString("fr-FR")} F`}
                      </span>
                      {plan.prix > 0 && <span className="text-zinc-500 text-sm font-bold">/mois</span>}
                    </div>
                    <p className="text-xs text-zinc-400 font-medium">
                      {isPro
                        ? "Idéal pour les boutiques en forte croissance."
                        : isEnterprise
                        ? "Pour les grandes entreprises multi-boutiques."
                        : "Pour tester et lancer votre activité."}
                    </p>
                  </div>

                  <ul className="space-y-3 flex-1 border-t border-zinc-800 pt-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-xs text-zinc-300 font-bold">
                        <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" strokeWidth={3} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => {
                      if (plan.prix === 0) {
                        router.push("/boutiques");
                      } else {
                        setSelectedPlan(plan);
                        setStep(2);
                      }
                    }}
                    className={cn(
                      "w-full h-12 rounded-xl font-black text-xs sm:text-sm transition-all duration-300",
                      isPro
                        ? "bg-brand hover:bg-brand/90 text-white shadow-xl shadow-brand/25"
                        : isEnterprise
                        ? "bg-zinc-200 hover:bg-zinc-300 text-zinc-950 shadow-xl shadow-zinc-200/10"
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                    )}
                  >
                    {plan.prix === 0 ? "Commencer gratuitement" : "S'abonner"}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* STEP 2: Checkout Method Selection */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-2xl"
          >
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black">Mode de Règlement</h2>
              <p className="text-xs text-zinc-400 font-bold">Sélectionnez le moyen de paiement pour {selectedPlan?.nom}</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Plan choisi</p>
                <p className="text-sm font-black text-zinc-200">{selectedPlan?.nom}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Total mensuel</p>
                <p className="text-lg font-black text-brand">{selectedPlan ? formatCurrency(selectedPlan.prix) : ""}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-zinc-500">Moyen de paiement</p>
              
              <div className="grid grid-cols-2 gap-3">
                {/* STRIPE */}
                <div
                  onClick={() => setSelectedMethod("STRIPE")}
                  className={cn(
                    "p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col items-center gap-2 bg-zinc-950/40 hover:border-zinc-700",
                    selectedMethod === "STRIPE" ? "border-brand bg-brand/5 text-brand" : "border-zinc-800 text-zinc-500"
                  )}
                >
                  <div className="flex gap-1 justify-center items-center h-6 shrink-0">
                    {/* Visa */}
                    <svg width="24" height="15" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded shadow-sm">
                      <rect width="24" height="15" rx="2" fill="#1A1F71" />
                      <text x="12" y="11" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize="8" fill="#FFF" fontStyle="italic">VISA</text>
                    </svg>
                    {/* Mastercard */}
                    <svg width="24" height="15" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded shadow-sm">
                      <rect width="24" height="15" rx="2" fill="#222" />
                      <circle cx="10" cy="7.5" r="4.5" fill="#EB001B" />
                      <circle cx="14" cy="7.5" r="4.5" fill="#F79E1B" opacity="0.85" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-black">Stripe / Carte</span>
                </div>

                {/* WAVE */}
                <div
                  onClick={() => setSelectedMethod("WAVE")}
                  className={cn(
                    "p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col items-center gap-2 bg-zinc-950/40 hover:border-zinc-700",
                    selectedMethod === "WAVE" ? "border-brand bg-brand/5 text-brand" : "border-zinc-800 text-zinc-500"
                  )}
                >
                  <svg width="32" height="20" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 shadow-sm rounded h-6 w-auto">
                    <rect width="32" height="20" rx="4" fill="#00C2C9" />
                    <path d="M6 10C10 6 12 14 16 10C20 6 22 14 26 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[10px] font-black">Wave</span>
                </div>

                {/* ORANGE MONEY */}
                <div
                  onClick={() => setSelectedMethod("ORANGE_MONEY")}
                  className={cn(
                    "p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col items-center gap-2 bg-zinc-950/40 hover:border-zinc-700",
                    selectedMethod === "ORANGE_MONEY" ? "border-brand bg-brand/5 text-brand" : "border-zinc-800 text-zinc-500"
                  )}
                >
                  <svg width="32" height="20" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 shadow-sm rounded h-6 w-auto">
                    <rect width="32" height="20" rx="4" fill="#FF6600" />
                    <text x="16" y="14.5" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="11" fill="white" letterSpacing="-0.5">OM</text>
                  </svg>
                  <span className="text-[10px] font-black">Orange Money</span>
                </div>

                {/* PAYPAL */}
                <div
                  onClick={() => setSelectedMethod("PAYPAL")}
                  className={cn(
                    "p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col items-center gap-2 bg-zinc-950/40 hover:border-zinc-700",
                    selectedMethod === "PAYPAL" ? "border-brand bg-brand/5 text-brand" : "border-zinc-800 text-zinc-500"
                  )}
                >
                  <svg width="32" height="20" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 shadow-sm rounded h-6 w-auto">
                    <rect width="32" height="20" rx="4" fill="#003087" />
                    <text x="16" y="14.5" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="10" fill="white" fontStyle="italic" letterSpacing="-0.5">PayPal</text>
                  </svg>
                  <span className="text-[10px] font-black">PayPal</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-zinc-850">
              <Button
                variant="ghost"
                className="flex-1 h-12 rounded-xl font-black text-zinc-400 hover:text-white"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Retour
              </Button>
              <Button
                onClick={handleSubscribe}
                disabled={loading}
                className="flex-1 h-12 rounded-xl font-black text-xs sm:text-sm bg-brand hover:bg-brand/90 text-white shadow-xl shadow-brand/20"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirmer
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
