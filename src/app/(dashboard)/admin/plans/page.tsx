import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PlansClientView } from "./_components/plans-client-view";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "Plans Tarifaires - Admin" };

export default async function AdminPlansPage() {
  const plans = await prisma.plan.findMany({ orderBy: { prix: "asc" } });

  return (
    <div className="space-y-8 pb-20">
      {/* Dynamic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 to-orange-950 p-8 sm:p-12 text-white shadow-2xl border border-white/10">
        <div className="absolute right-[-10%] top-[-20%] h-64 w-64 rounded-full bg-orange-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute left-[-10%] bottom-[-20%] h-64 w-64 rounded-full bg-amber-500/20 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter flex items-center gap-3">
              Plans &amp; <span className="text-orange-400">Tarifications</span>
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400" />
            </h1>
            <p className="text-sm text-slate-400 max-w-xl font-bold leading-relaxed">
              Consultez les offres d&apos;abonnements actives sur la plateforme et les limites de quotas associées à chaque formule SaaS.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/50 bg-white/60 backdrop-blur-xl p-4 sm:p-8 shadow-xl shadow-slate-200/30 dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none">
        <PlansClientView plans={plans} />
      </div>
    </div>
  );
}

