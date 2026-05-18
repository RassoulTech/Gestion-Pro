import { prisma } from "@/lib/prisma";
import { PlansClientView } from "./_components/plans-client-view";
import { Sparkles } from "lucide-react";

export const metadata = { title: "Plans Tarifaires - Admin" };

export default async function AdminPlansPage() {
  const plans = await prisma.plan.findMany({ orderBy: { prix: "asc" } });

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0 border-b border-zinc-100 pb-6 dark:border-zinc-900">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-violet-50 p-2 dark:bg-violet-950/30">
              <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Plans &amp; Tarifications
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Consultez les offres d&apos;abonnements actives sur la plateforme et les quotas associés à chaque formule.
          </p>
        </div>
      </div>

      <PlansClientView plans={plans} />
    </div>
  );
}

