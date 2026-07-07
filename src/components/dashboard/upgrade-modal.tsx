"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Sparkles, Loader2, ArrowRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { WaveIcon, OrangeMoneyIcon } from "@/components/icons/brand-icons";
import { getPlansAction, initiatePlanSubscription } from "@/server/actions/subscription.actions";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

type PlanType = {
  id: string;
  nom: string;
  prix: number;
  dureeEssaiJours: number;
  maxBoutiques: number;
  maxProduits: number;
  features: any[];
};

export function UpgradeModal({
  isOpen,
  onClose,
  title = "Améliorez votre forfait",
  description = "Débloquez la pleine puissance de GestionPro avec nos offres adaptées à votre croissance.",
}: UpgradeModalProps) {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanType[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"WAVE" | "ORANGE_MONEY">("WAVE");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getPlansAction()
        .then((res) => {
          if (res?.data) {
            setPlans(res.data as PlanType[]);
            // Select Pro by default
            const proPlan = (res.data as PlanType[]).find((p) => p.nom === "Pro");
            if (proPlan) setSelectedPlan(proPlan);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  async function handlePaymentInitiation() {
    if (!selectedPlan) return;

    setLoading(true);
    try {
      const result = await initiatePlanSubscription({
        planId: selectedPlan.id,
        method: selectedMethod,
      });

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }

      if (result?.data?.paymentUrl) {
        toast.success("Redirection vers la passerelle de paiement...");
        if (result.data.paymentUrl.startsWith("http://") || result.data.paymentUrl.startsWith("https://")) {
          window.location.href = result.data.paymentUrl;
        } else {
          router.push(result.data.paymentUrl);
        }
      } else {
        toast.error("Impossible de démarrer la session de paiement.");
      }
    } catch {
      toast.error("Une erreur est survenue lors de la souscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full p-0 border-none bg-zinc-950 text-white sm:rounded-[2.5rem] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="grid md:grid-cols-12 flex-1 overflow-y-auto">
          {/* Main comparative grid or details */}
          <div className="md:col-span-8 p-5 sm:p-8 md:p-10 space-y-6 flex flex-col justify-between h-max">
            <div>
              <DialogHeader className="text-left space-y-2">
                <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-brand animate-pulse" /> {title}
                </DialogTitle>
                <DialogDescription className="text-zinc-400 font-bold text-xs sm:text-sm">
                  {description}
                </DialogDescription>
              </DialogHeader>

              {loading && plans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-10 w-10 text-brand animate-spin" />
                  <p className="text-zinc-400 text-xs font-black uppercase tracking-wider">Chargement des forfaits...</p>
                </div>
              ) : step === 1 ? (
                /* STEP 1: Plan Selector Grid */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 sm:mt-8">
                  {plans.map((plan) => {
                    const isPro = plan.nom === "Pro";
                    const isEnterprise = plan.nom === "Enterprise";
                    const isSelected = selectedPlan?.id === plan.id;

                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={cn(
                          "relative p-5 rounded-2xl cursor-pointer border-2 transition-all flex flex-wrap sm:flex-col justify-between gap-4 sm:gap-0",
                          isSelected
                            ? isPro
                              ? "border-brand bg-white/5 shadow-lg shadow-brand/10 sm:scale-[1.02]"
                              : isEnterprise
                              ? "border-zinc-400 bg-white/5 shadow-lg shadow-zinc-400/10 sm:scale-[1.02]"
                              : "border-zinc-500 bg-white/5"
                            : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                        )}
                      >
                        {isPro && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full text-white shadow">
                            Recommandé
                          </div>
                        )}
                        {isEnterprise && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-200 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full text-zinc-950 shadow">
                            Premium
                          </div>
                        )}

                        <div className="space-y-1 w-1/2 sm:w-full">
                          <h4 className="font-extrabold text-sm text-zinc-100">{plan.nom}</h4>
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-lg sm:text-xl font-black text-white">
                              {plan.prix === 0 ? "Gratuit" : `${plan.prix.toLocaleString("fr-FR")} F`}
                            </span>
                            {plan.prix > 0 && <span className="text-[10px] text-zinc-500 font-bold">/mois</span>}
                          </div>
                        </div>

                        <ul className="space-y-2 mt-0 sm:mt-4 flex-1 w-1/2 sm:w-full">
                          {plan.features.map((feature, index) => {
                            const isObj = feature && typeof feature === "object" && "text" in feature;
                            const text = isObj ? (feature as any).text : String(feature);
                            const isIncluded = isObj ? !!(feature as any).included : true;

                            return (
                              <li
                                key={index}
                                className={cn(
                                  "flex items-start gap-2 text-[10px] font-medium leading-tight transition-all duration-300",
                                  isIncluded
                                    ? "text-zinc-300"
                                    : "text-zinc-500/50 line-through decoration-zinc-800"
                                )}
                              >
                                <div
                                  className={cn(
                                    "mt-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300",
                                    isIncluded
                                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                      : "bg-red-500/5 border-red-500/10 text-red-500/30"
                                  )}
                                >
                                  {isIncluded ? (
                                    <Check className="h-2 w-2" strokeWidth={3} />
                                  ) : (
                                    <X className="h-1.5 w-1.5" strokeWidth={3} />
                                  )}
                                </div>
                                <span className={cn("truncate", !isIncluded && "opacity-75")}>{text}</span>
                              </li>
                            );
                          })}
                        </ul>

                        {/* Mobile explicit select button */}
                        <div className="mt-4 sm:hidden w-full flex justify-end">
                          <div className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider", isSelected ? "bg-brand text-white" : "bg-white/10 text-zinc-300")}>
                            {isSelected ? "Sélectionné" : "Choisir"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* STEP 2: Checkout Method Selector */
                <div className="mt-6 sm:mt-8 space-y-6">
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] sm:text-xs text-zinc-500 font-black uppercase tracking-wider">Plan sélectionné</p>
                      <p className="text-base sm:text-lg font-black text-white">{selectedPlan?.nom}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] sm:text-xs text-zinc-500 font-black uppercase tracking-wider">Montant total</p>
                      <p className="text-xl sm:text-2xl font-black text-brand">{selectedPlan ? formatCurrency(selectedPlan.prix) : ""}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-zinc-400">Sélectionnez votre moyen de paiement</p>
                    
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      {/* WAVE */}
                      <div
                        onClick={() => setSelectedMethod("WAVE")}
                        className={cn(
                          "p-3 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 bg-zinc-900/50 hover:border-zinc-700",
                          selectedMethod === "WAVE" ? "border-brand bg-brand/5 text-brand" : "border-zinc-800 text-zinc-500"
                        )}
                      >
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white ring-1 ring-white/10 shadow-sm overflow-hidden p-1.5 shrink-0">
                          <WaveIcon className="h-full w-full rounded-md" />
                        </span>
                        <span className="text-[10px] sm:text-xs font-black">Wave</span>
                      </div>

                      {/* ORANGE MONEY */}
                      <div
                        onClick={() => setSelectedMethod("ORANGE_MONEY")}
                        className={cn(
                          "p-3 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 bg-zinc-900/50 hover:border-zinc-700",
                          selectedMethod === "ORANGE_MONEY" ? "border-brand bg-brand/5 text-brand" : "border-zinc-800 text-zinc-500"
                        )}
                      >
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white ring-1 ring-white/10 shadow-sm overflow-hidden p-1.5 shrink-0">
                          <OrangeMoneyIcon className="h-full w-full" />
                        </span>
                        <span className="text-[10px] sm:text-xs font-black text-center leading-none">Orange Money</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer action buttons */}
            <div className="flex items-center justify-between border-t border-zinc-900 pt-5 mt-6 pb-2">
              {step === 2 ? (
                <Button
                  variant="ghost"
                  className="rounded-xl font-black text-zinc-400 hover:text-white"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Retour
                </Button>
              ) : (
                <div className="text-[9px] sm:text-[10px] text-zinc-500 font-bold max-w-[150px] sm:max-w-[200px]">
                  Paiement sécurisé et crypté. Annulez à tout moment.
                </div>
              )}

              <Button
                disabled={loading || !selectedPlan}
                onClick={step === 1 ? () => setStep(2) : handlePaymentInitiation}
                className={cn(
                  "h-12 px-5 sm:px-6 rounded-xl font-black text-xs sm:text-sm shadow-xl shadow-brand/10 text-white shrink-0",
                  selectedPlan?.nom === "Enterprise"
                    ? "bg-zinc-200 hover:bg-zinc-300 text-zinc-950 shadow-zinc-200/15"
                    : "bg-brand hover:bg-brand/90"
                )}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : step === 1 ? (
                  <>
                    Continuer <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Payer maintenant <ShieldCheck className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right sidebar details - hidden on small screens entirely */}
          <div className="hidden md:flex md:col-span-4 bg-zinc-900 border-l border-zinc-800 p-8 flex-col justify-between">
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                Pourquoi s&apos;abonner ?
              </h4>

              <ul className="space-y-4">
                <li className="space-y-1">
                  <p className="text-xs font-extrabold text-zinc-200">Boutiques illimitées</p>
                  <p className="text-[10px] text-zinc-400">Gérez plusieurs points de vente depuis un tableau de bord consolidé unique.</p>
                </li>
                <li className="space-y-1">
                  <p className="text-xs font-extrabold text-zinc-200">Terminal POS avancé</p>
                  <p className="text-[10px] text-zinc-400">Vendez instantanément en ligne, gérez les clients fidélisés et émettez des reçus professionnels.</p>
                </li>
                <li className="space-y-1">
                  <p className="text-xs font-extrabold text-zinc-200">Comptabilité intégrée</p>
                  <p className="text-[10px] text-zinc-400">Bénéficiez de rapports analytiques avancés, d&apos;exports PDF/Excel et d&apos;outils de suivi précis.</p>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-black">
                <ShieldCheck className="h-4 w-4 text-brand" /> Satisfaction
              </div>
              <p className="text-[9px] text-zinc-500 font-medium">
                Notre équipe répond à toutes vos questions sous 24h ouvrées. Écrivez-nous à support@gestionpro.app.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Simple Helper Lucide Icons to prevent runtime errors
function Smartphone(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function ShieldCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
