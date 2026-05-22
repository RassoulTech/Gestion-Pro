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
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-zinc-950 to-zinc-900 p-8 sm:p-12 text-white shadow-2xl border border-zinc-800">
        <div className="absolute right-[-10%] top-[-20%] h-64 w-64 rounded-full bg-orange-600/20 blur-[100px] pointer-events-none" />
        <div className="absolute left-[-10%] bottom-[-20%] h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter flex items-center gap-3">
              Plans &amp; <span className="text-orange-500">Tarifications</span>
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl font-bold leading-relaxed">
              Consultez les offres d&apos;abonnements actives sur la plateforme et les limites de quotas associées à chaque formule SaaS.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[2.5rem] border border-zinc-200/50 bg-white p-4 sm:p-8 shadow-xl shadow-zinc-200/40 dark:border-zinc-800/50 dark:bg-zinc-900 dark:shadow-none">
        <PlansClientView plans={plans} />
      </div>
    </div>
  );
}

