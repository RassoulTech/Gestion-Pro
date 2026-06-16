"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { confirmMockOrderPayment } from "@/server/actions/marketplace-checkout.actions";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Loader2, CheckCircle2, XCircle, FlaskConical } from "lucide-react";

function MockOrderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const ref = searchParams.get("ref") ?? "";
  const ids = searchParams.get("ids") ?? "";
  const amount = Number(searchParams.get("amount") ?? "0");
  const method = searchParams.get("method") ?? "";

  const { execute, isExecuting } = useAction(confirmMockOrderPayment, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        router.push(
          `/checkout/success?success=true&method=${encodeURIComponent(method)}&ids=${encodeURIComponent(ids)}`
        );
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Échec de la confirmation simulée.");
    },
  });

  const invalid = !ref || !ids;

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 bg-[#F8FAFC] dark:bg-[#0a0a0a]">
      <div className="w-full max-w-md mx-auto">
        <div className="relative p-8 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2rem] shadow-xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500" />

          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-black uppercase tracking-wider px-3 py-1.5">
              <FlaskConical className="h-3.5 w-3.5" />
              Mode test
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            Simulateur de paiement
          </h1>
          <p className="text-sm font-semibold text-slate-400 mb-6">
            Aucune transaction réelle n&apos;est effectuée. Choisissez l&apos;issue à simuler.
          </p>

          {invalid ? (
            <p className="text-sm font-bold text-red-500">
              Référence de commande manquante. Retournez au panier.
            </p>
          ) : (
            <>
              <div className="rounded-2xl bg-slate-50 dark:bg-zinc-800/60 p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-400">Méthode</span>
                  <span className="font-bold">{method || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-400">Montant</span>
                  <span className="font-black text-orange-600">{formatCurrency(amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-400">Référence</span>
                  <span className="font-mono text-xs font-bold truncate max-w-[55%]">{ref}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => execute({ ids, transactionRef: ref })}
                  disabled={isExecuting}
                  className="w-full h-12 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isExecuting ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                  )}
                  Simuler un paiement réussi
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast.message("Paiement simulé comme échoué. Commande non confirmée.");
                    router.push("/panier");
                  }}
                  disabled={isExecuting}
                  className="w-full h-12 rounded-xl font-bold border-slate-200 dark:border-zinc-800"
                >
                  <XCircle className="mr-2 h-5 w-5 text-red-500" />
                  Simuler un échec
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MockOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
        </div>
      }
    >
      <MockOrderInner />
    </Suspense>
  );
}
