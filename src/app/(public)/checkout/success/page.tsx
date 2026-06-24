import Link from "next/link";
import { CheckCircle2, ArrowRight, Package } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { PaytechSandboxBadge } from "@/components/payments/paytech-sandbox-badge";

export default async function CheckoutSuccessPage() {
  const t = await getTranslations("checkout");
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 sm:py-24 bg-[#F8FAFC] dark:bg-[#0a0a0a]">
      <PaytechSandboxBadge />
      <div className="w-full max-w-xl mx-auto px-4 text-center">
        <div className="relative p-8 sm:p-12 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-[2rem] sm:rounded-[3rem] shadow-xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-600" />
          
          <div className="mx-auto h-24 w-24 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 mb-8 shadow-inner">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-zinc-100 mb-4 tracking-tight">
            {t("successTitle")}
          </h1>

          <p className="text-slate-500 dark:text-zinc-400 mb-10 text-base sm:text-lg leading-relaxed">
            {t("successText")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild variant="brand" className="w-full sm:w-auto rounded-2xl h-14 px-8 font-black shadow-lg shadow-orange-500/20">
              <Link href="/mes-commandes">
                <Package className="mr-2 h-5 w-5" />
                {t("trackOrder")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto rounded-2xl h-14 px-8 font-bold border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800">
              <Link href="/marketplace">
                {t("continueShopping")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
