"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Loader2, X } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPlansAction, initiatePlanSubscription } from "@/server/actions/subscription.actions";
import { toast } from "sonner";
import { formatPrice, type Currency } from "@/lib/format";

type PlanType = {
  id: string;
  nom: string;
  prix: number;
  dureeEssaiJours: number;
  maxBoutiques: number;
  maxProduits: number;
  features: any[];
};

export default function PricingPage() {
  const t = useTranslations("public.pricingPage");
  const router = useRouter();
  const [plans, setPlans] = useState<PlanType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"WAVE" | "ORANGE_MONEY">("WAVE");
  const [step, setStep] = useState<1 | 2>(1);

  const [currency, setCurrency] = useState<Currency>("XOF");
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  const XOF_PER_EUR = 655.957;
  const XOF_PER_USD = 600;

  function getPriceInCurrency(priceInXOF: number): number {
    if (currency === "XOF") return priceInXOF;
    if (currency === "EUR") return priceInXOF / XOF_PER_EUR;
    if (currency === "USD") return priceInXOF / XOF_PER_USD;
    return priceInXOF;
  }

  function displayPrice(prix: number): { value: string; originalValue?: string; suffix: string } {
    if (prix === 0) return { value: t("free"), suffix: "" };

    const priceVal = getPriceInCurrency(prix);

    if (billingInterval === "yearly") {
      const discounted = priceVal * 0.8;
      return {
        value: formatPrice(discounted, currency),
        originalValue: formatPrice(priceVal, currency),
        suffix: t("perMonth")
      };
    }

    return {
      value: formatPrice(priceVal, currency),
      suffix: "/ mois"
    };
  }

  useEffect(() => {
    setLoading(true);
    getPlansAction()
      .then((res) => {
        if (res?.data) {
          setPlans(res.data as PlanType[]);
        }
      })
      .catch(() => {
        toast.error(t("toastPlansError"));
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
          toast.error(t("toastLogin"));
          router.push("/login?callbackUrl=/pricing");
        } else if (result.serverError.includes("permissions")) {
          toast.info(t("toastVendor"));
          router.push("/onboarding");
        } else {
          toast.error(result.serverError);
        }
        return;
      }

      if (result?.data?.paymentUrl) {
        toast.success(t("toastRedirect"));
        if (result.data.paymentUrl.startsWith("http://") || result.data.paymentUrl.startsWith("https://")) {
          window.location.href = result.data.paymentUrl;
        } else {
          router.push(result.data.paymentUrl);
        }
      } else {
        toast.error(t("toastInitError"));
      }
    } catch {
      toast.error(t("genericError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-20 px-4 sm:px-6 relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-zinc-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-16 relative z-10">
        {/* Title */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-black uppercase tracking-widest">
            <Sparkles className="h-3 w-3" /> {t("eyebrow")}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            {t("title")}
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto font-medium text-sm">
            {t("subtitle")}
          </p>
        </div>

        {/* Switchers (visible at step 1) */}
        {step === 1 && (
          <div className="flex flex-col items-center gap-4">
            {/* Currencies Toggle */}
            <div className="inline-flex p-1 bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 shadow-xl">
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
            <div className="inline-flex p-1 bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 shadow-xl items-center">
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
                {t("monthly")}
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
                <span>{t("yearly")}</span>
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
                <span>{t("save", { amount: currency === "XOF" ? "47 760 FCFA" : currency === "EUR" ? "72,80 €" : "79,60 $" })}</span>
              </motion.div>
            )}
          </div>
        )}

        {loading && plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 text-brand animate-spin" />
            <p className="text-zinc-500 text-xs font-black uppercase tracking-wider">{t("loading")}</p>
          </div>
        ) : step === 1 ? (
          /* STEP 1: Comparison Cards Grid */
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const isPro = plan.nom === "Pro";
              const isEnterprise = plan.nom === "Enterprise";
              const { value, originalValue, suffix } = displayPrice(plan.prix);

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
                      {t("popular")}
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-xl font-extrabold text-zinc-100">{plan.nom}</h3>
                    <div className="flex flex-col justify-end min-h-[4.5rem]">
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
                        <span className="text-4xl font-black text-white tabular-nums">
                          {value}
                        </span>
                        {plan.prix > 0 && suffix && (
                          <span className="text-zinc-500 text-sm font-bold">{suffix}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 font-medium">
                      {isPro
                        ? t("descPro")
                        : isEnterprise
                        ? t("descEnterprise")
                        : t("descStarter")}
                    </p>
                  </div>

                  <ul className="space-y-3 flex-1 border-t border-zinc-800 pt-6">
                    {plan.features.map((feature, idx) => {
                      const isObj = feature && typeof feature === "object" && "text" in feature;
                      const text = isObj ? (feature as any).text : String(feature);
                      const isIncluded = isObj ? !!(feature as any).included : true;

                      return (
                        <li
                          key={idx}
                          className={cn(
                            "flex items-start gap-3 text-xs font-bold transition-all duration-300",
                            isIncluded
                              ? "text-zinc-300"
                              : "text-zinc-500/50 line-through decoration-zinc-800"
                          )}
                        >
                          <div
                            className={cn(
                              "mt-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300",
                              isIncluded
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                : "bg-red-500/5 border-red-500/10 text-red-500/30"
                            )}
                          >
                            {isIncluded ? (
                              <Check className="h-3 w-3" strokeWidth={3} />
                            ) : (
                              <X className="h-2.5 w-2.5" strokeWidth={3} />
                            )}
                          </div>
                          <span className={cn(!isIncluded && "opacity-75")}>{text}</span>
                        </li>
                      );
                    })}
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
                    {plan.prix === 0 ? t("ctaFree") : t("ctaSubscribe")}
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
              <h2 className="text-xl sm:text-2xl font-black">{t("step2Title")}</h2>
              <p className="text-xs text-zinc-400 font-bold">{t("step2Subtitle", { plan: selectedPlan?.nom ?? "" })}</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">{t("chosenPlan")}</p>
                <p className="text-sm font-black text-zinc-200">{selectedPlan?.nom}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">
                  {billingInterval === "yearly" ? t("totalYearly") : t("totalMonthly")}
                </p>
                <p className="text-lg font-black text-brand">
                  {selectedPlan ? (() => {
                    if (selectedPlan.prix === 0) return t("free");
                    const basePrice = getPriceInCurrency(selectedPlan.prix);
                    if (billingInterval === "yearly") {
                      return formatPrice((basePrice * 0.8) * 12, currency);
                    }
                    return formatPrice(basePrice, currency);
                  })() : ""}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-zinc-500">{t("paymentMethod")}</p>
              
              <div className="grid grid-cols-2 gap-3">
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
                    {/* High-fidelity right-facing Wave Penguin mascot */}
                    <ellipse cx="14" cy="17.5" rx="1.5" ry="0.8" fill="#FFC800" />
                    <ellipse cx="17.5" cy="17.5" rx="1.5" ry="0.8" fill="#FFC800" />
                    <circle cx="15.5" cy="7.5" r="3.2" fill="white" />
                    <ellipse cx="15" cy="13.5" rx="4.8" ry="4" fill="white" />
                    <rect x="11.8" y="7.5" width="6.4" height="6" fill="white" />
                    <polygon points="18.2,6.8 21.5,8 18.2,9.2" fill="#FFC800" />
                    <circle cx="16.8" cy="7.2" r="0.7" fill="#00C2C9" />
                    <path d="M12.5 11c.8-.5 2 0 2 1.5s-.8 2.5-1.8 2.5-1.8-1.5-1.8-2.5c0-.8.6-1 1.6-1.5z" fill="#00C2C9" />
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
                    {/* Official-style Orange Money diagonal arrows */}
                    <g stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="9" y1="13" x2="15" y2="7" />
                      <path d="M11 7h4v4" fill="none" />
                    </g>
                    <g stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="23" y1="7" x2="17" y2="13" />
                      <path d="M21 13h-4v-4" fill="none" />
                    </g>
                  </svg>
                  <span className="text-[10px] font-black">Orange Money</span>
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
                {t("back")}
              </Button>
              <Button
                onClick={handleSubscribe}
                disabled={loading}
                className="flex-1 h-12 rounded-xl font-black text-xs sm:text-sm bg-brand hover:bg-brand/90 text-white shadow-xl shadow-brand/20"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t("confirm")}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
