import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, ShieldCheck, Flame, Star } from "lucide-react";

export const metadata = { title: "Plans Tarifaires - Admin" };

// Helper to assign rich design values depending on plan tier
function getPlanDesign(nomPlan: string) {
  const name = nomPlan.toLowerCase();
  if (name.includes("pro") || name.includes("premium") || name.includes("gold") || name.includes("avance")) {
    return {
      gradient: "from-violet-600 to-indigo-600 text-white dark:from-violet-900/60 dark:to-indigo-950/60",
      accentBorder: "border-violet-500/30 dark:border-violet-500/50",
      textClass: "text-zinc-950 dark:text-zinc-50",
      badgeColor: "bg-violet-500 text-white border-none shadow-[0_0_8px_rgba(124,58,237,0.4)]",
      icon: Flame,
      glow: "absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-600/10 blur-xl",
    };
  }
  if (name.includes("gratuit") || name.includes("free") || name.includes("essai") || name.includes("basic")) {
    return {
      gradient: "from-zinc-50 to-zinc-100 text-zinc-950 dark:from-zinc-900/40 dark:to-zinc-900/80",
      accentBorder: "border-zinc-200/50 dark:border-zinc-800/60",
      textClass: "text-zinc-950 dark:text-zinc-50",
      badgeColor: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
      icon: ShieldCheck,
      glow: "",
    };
  }
  return {
    gradient: "from-emerald-50/80 to-white/90 text-zinc-950 dark:from-emerald-950/10 dark:to-zinc-950/70",
    accentBorder: "border-emerald-500/20 dark:border-emerald-800/40",
    textClass: "text-zinc-950 dark:text-zinc-50",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30",
    icon: Star,
    glow: "absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-600/5 blur-xl",
  };
}

export default async function AdminPlansPage() {
  const plans = await prisma.plan.findMany({ orderBy: { prix: "asc" } });

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
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

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const design = getPlanDesign(plan.nom);
          const PlanIcon = design.icon;

          return (
            <div
              key={plan.id}
              className={`relative overflow-hidden rounded-2xl border bg-white p-6 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:bg-zinc-950 ${design.accentBorder}`}
            >
              {design.glow && <div className={design.glow} />}

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-zinc-50 p-2 dark:bg-zinc-900">
                    <PlanIcon className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {plan.nom}
                  </h3>
                </div>
                {plan.actif ? (
                  <Badge variant="outline" className={`font-semibold text-xs px-2.5 py-0.5 rounded-full ${design.badgeColor}`}>
                    Actif
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2.5 py-0.5">
                    Inactif
                  </Badge>
                )}
              </div>

              <div className="mb-6">
                <span className="text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {formatCurrency(plan.prix)}
                </span>
                <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">/mois</span>
              </div>

              <hr className="my-5 border-zinc-100 dark:border-zinc-900" />

              <div className="space-y-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>{plan.maxBoutiques} boutique(s) maximum</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>Jusqu&apos;à {plan.maxProduits} produits</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>{plan.dureeEssaiJours} jours d&apos;essai gratuit</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

