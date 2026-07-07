import Link from "next/link";
import type { Metadata } from "next";
import { XCircle, ArrowLeft, Package } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { PaytechSandboxBadge } from "@/components/payments/paytech-sandbox-badge";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return { title: t("cancelMetaTitle") };
}

export default async function CheckoutCancelPage() {
  const t = await getTranslations("checkout");
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 sm:py-24 bg-[#F8FAFC] dark:bg-[#0a0a0a]">
      <PaytechSandboxBadge />
      <div className="w-full max-w-xl mx-auto px-4 text-center">
        <div className="relative p-8 sm:p-12 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 rounded-[2rem] sm:rounded-[3rem] shadow-xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-red-500" />

          <div className="mx-auto h-24 w-24 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 mb-8 shadow-inner">
            <XCircle className="h-12 w-12" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-zinc-800 dark:text-zinc-100 mb-4 tracking-tight">
            {t("cancelTitle")}
          </h1>

          <p className="text-zinc-500 dark:text-zinc-400 mb-10 text-base sm:text-lg leading-relaxed">
            {t.rich("cancelText", {
              b: (chunks) => (
                <span className="font-bold text-zinc-700 dark:text-zinc-200">{chunks}</span>
              ),
            })}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild variant="brand" className="w-full sm:w-auto rounded-2xl h-14 px-8 font-black shadow-lg shadow-orange-500/20">
              <Link href="/marketplace">
                <ArrowLeft className="mr-2 h-5 w-5" />
                {t("retry")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto rounded-2xl h-14 px-8 font-bold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800">
              <Link href="/mes-commandes">
                <Package className="mr-2 h-5 w-5" />
                {t("myOrders")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
