"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Check, Smartphone, CreditCard, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";
import { confirmMockOrderPayment } from "@/server/actions/marketplace-checkout.actions";

function OrderCheckoutMockPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionRef = searchParams.get("ref") || "";
  const amountStr = searchParams.get("amount") || "0";
  const amount = parseInt(amountStr, 10);
  const method = (searchParams.get("method") || "WAVE").toUpperCase();
  const ids = searchParams.get("ids") || "";

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Wave states
  const [pin, setPin] = useState("");
  
  // Orange Money states
  const [omCode, setOmCode] = useState("");

  // PayPal/Credit Card states
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  useEffect(() => {
    if (!transactionRef || !ids) {
      toast.error("Paramètres de paiement invalides.");
    }
  }, [transactionRef, ids]);

  async function handlePaymentSuccess() {
    if (!transactionRef || !ids) {
      toast.error("Référence de transaction ou identifiants de commande manquants.");
      return;
    }

    setLoading(true);
    try {
      const res = await confirmMockOrderPayment({ ids, transactionRef });

      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }

      if (res?.data?.success) {
        setSuccess(true);
        toast.success("Paiement validé avec succès !");
        
        // Wait 1.5s then redirect to success page
        setTimeout(() => {
          router.push(`/checkout/success?success=true&method=${method.toLowerCase()}&ids=${ids}`);
        }, 1500);
      } else {
        toast.error("Impossible de confirmer le paiement.");
      }
    } catch {
      toast.error("Une erreur est survenue lors de la confirmation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden text-white font-sans">
      {/* Dynamic light glows in background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative"
          >
            {/* Header info */}
            <div className="mb-6 text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                <Lock className="h-3 w-3 text-emerald-500" /> Passerelle de Paiement Client (Démo)
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">Règlement de votre Commande</h2>
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 mt-4 flex items-center justify-between">
                <div className="text-left">
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Référence</p>
                  <p className="text-xs font-mono font-bold text-zinc-300 truncate max-w-[150px]">{transactionRef}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Total à Payer</p>
                  <p className="text-base font-black text-emerald-400">{formatCurrency(amount)}</p>
                </div>
              </div>
            </div>

            {/* WAVE MOCK INTERFACE */}
            {method === "WAVE" && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-sky-500 text-white flex flex-col items-center gap-3 relative overflow-hidden shadow-lg">
                  <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white font-black text-xl shadow-inner">
                    🐧
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black uppercase tracking-widest opacity-80">Validation Wave Mobile Money</p>
                    <p className="text-sm font-bold">Entrez votre code PIN pour valider</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-center gap-3">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "h-5 w-5 rounded-full border-2 transition-all duration-200",
                          pin.length > idx ? "bg-sky-400 border-sky-400 scale-110" : "border-zinc-700 bg-zinc-850"
                        )}
                      />
                    ))}
                  </div>

                  {/* Virtual PIN Pad */}
                  <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto pt-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        onClick={() => pin.length < 4 && setPin((p) => p + num)}
                        className="h-12 w-12 rounded-full bg-zinc-800 hover:bg-zinc-700 text-lg font-black transition active:scale-95 flex items-center justify-center text-white"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      onClick={() => setPin("")}
                      className="text-xs font-black text-zinc-500 hover:text-zinc-300 transition active:scale-95"
                    >
                      Effacer
                    </button>
                    <button
                      onClick={() => pin.length < 4 && setPin((p) => p + "0")}
                      className="h-12 w-12 rounded-full bg-zinc-800 hover:bg-zinc-700 text-lg font-black transition active:scale-95 flex items-center justify-center text-white"
                    >
                      0
                    </button>
                    <button
                      disabled={pin.length < 4 || loading}
                      onClick={handlePaymentSuccess}
                      className={cn(
                        "h-12 w-12 rounded-full text-xs font-black transition active:scale-95 flex items-center justify-center",
                        pin.length === 4 ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" : "bg-zinc-800 text-zinc-650 cursor-not-allowed"
                      )}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-5 w-5 text-white" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ORANGE MONEY MOCK INTERFACE */}
            {method === "ORANGE_MONEY" && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-amber-600 text-white flex flex-col items-center gap-3 relative overflow-hidden shadow-lg">
                  <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white font-black text-xl shadow-inner">
                    🍊
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest opacity-80">Orange Money</p>
                    <p className="text-xs text-amber-200 font-bold">Pour confirmer, tapez le code secret reçu par SMS</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Code de Validation (6 chiffres)</label>
                    <Input
                      type="password"
                      maxLength={6}
                      placeholder="••••••"
                      value={omCode}
                      onChange={(e) => setOmCode(e.target.value.replace(/\D/g, ""))}
                      className="h-12 rounded-xl bg-zinc-800/80 border-none font-bold text-center text-lg tracking-widest text-white placeholder-zinc-600"
                    />
                  </div>

                  <Button
                    disabled={omCode.length < 6 || loading}
                    onClick={handlePaymentSuccess}
                    className="w-full h-14 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-lg shadow-amber-600/20 border-none"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Valider le Paiement Orange Money
                  </Button>
                </div>
              </div>
            )}

            {/* PAYPAL MOCK INTERFACE */}
            {method === "PAYPAL" && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-blue-700 text-white flex flex-col items-center gap-3 relative overflow-hidden shadow-lg">
                  <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white font-black text-xl shadow-inner">
                    💳
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest opacity-80">PayPal / Carte de Crédit</p>
                    <p className="text-xs text-blue-200 font-bold">Renseignez vos coordonnées de carte fictive</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nom sur la carte</label>
                    <Input
                      placeholder="Mamadou Diallo"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="h-12 rounded-xl bg-zinc-800/80 border-none font-bold text-white placeholder-zinc-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Numéro de carte</label>
                    <Input
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      maxLength={19}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "");
                        let formatted = val.match(/.{1,4}/g)?.join(" ") || val;
                        setCardNumber(formatted);
                      }}
                      className="h-12 rounded-xl bg-zinc-800/80 border-none font-bold text-white placeholder-zinc-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Expiration</label>
                      <Input
                        placeholder="MM/AA"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, "");
                          if (val.length > 2) {
                            val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                          }
                          setCardExpiry(val);
                        }}
                        className="h-12 rounded-xl bg-zinc-800/80 border-none font-bold text-center text-white placeholder-zinc-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">CVV</label>
                      <Input
                        placeholder="123"
                        maxLength={3}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                        className="h-12 rounded-xl bg-zinc-800/80 border-none font-bold text-center text-white placeholder-zinc-600"
                      />
                    </div>
                  </div>

                  <Button
                    disabled={!cardName || cardNumber.length < 19 || cardExpiry.length < 5 || cardCvv.length < 3 || loading}
                    onClick={handlePaymentSuccess}
                    className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-600/20 border-none"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Valider le Paiement PayPal
                  </Button>
                </div>
              </div>
            )}

            {/* Cancel link */}
            <div className="text-center mt-6">
              <Button
                variant="link"
                onClick={() => router.push("/panier")}
                className="text-xs text-zinc-500 hover:text-zinc-300 font-bold"
              >
                Retourner au panier
              </Button>
            </div>
          </motion.div>
        ) : (
          /* SUCCESS INTERMEDIATE LOADER */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl relative"
          >
            <div className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
              <Check className="h-10 w-10" strokeWidth={3} />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                <Sparkles className="h-3 w-3" /> Succès !
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Commande Validée</h2>
              <p className="text-zinc-400 text-sm font-semibold leading-relaxed">
                Votre paiement a été traité avec succès. Vous allez être redirigé vers votre reçu de commande...
              </p>
            </div>

            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OrderCheckoutMockPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
          <p className="text-sm text-zinc-400 font-bold">Chargement du paiement...</p>
        </div>
      </div>
    }>
      <OrderCheckoutMockPageContent />
    </Suspense>
  );
}
