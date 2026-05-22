import React from "react";
import { redirect, notFound } from "next/navigation";
import {
  CreditCard,
  Calendar,
  Layers,
  History,
  TrendingUp,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getVendeurQuotas,
  checkBoutiqueCreationLimit,
  checkProduitCreationLimit,
  checkMembreCreationLimit,
} from "@/lib/quotas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuotaIndicator } from "@/components/dashboard/quota-indicators";
import Link from "next/link";
import { ManageStripeButton } from "./_components/manage-stripe-button";
import { RenewSubscriptionButton } from "./_components/renew-subscription-button";
import { PaymentFeedbackToast } from "./_components/payment-feedback-toast";
import { Suspense } from "react";

interface FacturationPageProps {
  params: Promise<{ id: string }>;
}

function PaymentStatusBadge({ status }: { status: string }) {
  if (status === "CONFIRME") {
    return <span className="inline-flex px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">Confirmé</span>;
  }
  if (status === "EN_ATTENTE") {
    return <span className="inline-flex px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/20">En attente</span>;
  }
  return <span className="inline-flex px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider border border-rose-500/20">Échoué</span>;
}

export default async function FacturationPage({ params }: FacturationPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Get current vendor
  const vendeur = await prisma.vendeur.findUnique({
    where: { userId: session.user.id },
  });

  if (!vendeur) notFound();

  // Get quotas and active/expired abonnements
  const quotas = await getVendeurQuotas(vendeur.id);

  const abonnements = await prisma.abonnement.findMany({
    where: { vendeurId: vendeur.id },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  const activeAbonnement = abonnements.find(
    (a) => a.statut === "ACTIF" || a.statut === "ESSAI"
  );

  // Detect renewal need: expired, OR active/trial whose end date is within 7 days
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const lastAbonnement = abonnements[0];
  const renewalRelevantEnd =
    activeAbonnement?.dateFin ?? activeAbonnement?.essaiFin ?? null;
  const renewalUrgent = lastAbonnement?.statut === "EXPIRE";
  const renewalNeeded =
    renewalUrgent ||
    (!!renewalRelevantEnd &&
      renewalRelevantEnd.getTime() - Date.now() <= SEVEN_DAYS_MS);
  const renewalPlanName =
    activeAbonnement?.plan.nom ?? lastAbonnement?.plan.nom ?? "";
  const renewalAmount =
    activeAbonnement?.plan.prix ?? lastAbonnement?.plan.prix ?? 0;

  // Get counts for quotas
  const boutiqueLimit = await checkBoutiqueCreationLimit(vendeur.id);
  const produitLimit = await checkProduitCreationLimit(id, vendeur.id);
  const membreLimit = await checkMembreCreationLimit(id, vendeur.id);

  // Fetch all payments for vendor
  const payments = await prisma.paiement.findMany({
    where: {
      abonnement: {
        vendeurId: vendeur.id,
      },
    },
    include: {
      abonnement: {
        include: { plan: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate pricing URL or options
  const pricingUrl = `/pricing?boutiqueId=${id}`;

  return (
    <div className="space-y-8 pb-20">
      <Suspense fallback={null}>
        <PaymentFeedbackToast />
      </Suspense>
      {/* Dynamic Header */}
      <div className="relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-br from-zinc-950 to-zinc-900 p-6 sm:p-12 text-white shadow-2xl border border-zinc-800">
        <div className="absolute right-[-10%] top-[-20%] h-64 w-64 rounded-full bg-brand/20 blur-[100px] pointer-events-none" />
        <div className="absolute left-[-10%] bottom-[-20%] h-64 w-64 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Sparkles className="h-4 w-4 text-brand" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                Abonnement & Facturation
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter">
              Gérez votre <span className="text-brand">Forfait</span>
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl font-bold leading-relaxed">
              Consultez vos factures, surveillez l'utilisation de vos ressources et passez au niveau supérieur pour débloquer plus de fonctionnalités.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {renewalNeeded && renewalPlanName && (
              <RenewSubscriptionButton
                planName={renewalPlanName}
                amount={renewalAmount}
                urgent={renewalUrgent}
              />
            )}
            <Button
              asChild
              className="h-14 sm:h-12 rounded-2xl sm:rounded-xl px-8 font-black bg-brand hover:bg-brand/90 text-white shadow-xl shadow-brand/20 hover:scale-[1.02] transition-all w-full sm:w-auto flex items-center justify-center"
            >
              <Link href={pricingUrl}>
                <TrendingUp className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                Mettre à niveau
              </Link>
            </Button>
            {vendeur.stripeCustomerId && (
              <div className="w-full sm:w-auto">
                <ManageStripeButton hasStripeCustomer={!!vendeur.stripeCustomerId} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column (2/3): Plan Info & Quotas */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Plan Card */}
          <div className="relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none p-6 sm:p-10">
            <div className="absolute right-0 top-0 h-32 w-32 bg-brand/5 blur-3xl rounded-full" />
            
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                  Forfait <span className="text-brand">{quotas.nom}</span>
                </h2>
                <p className="text-zinc-500 font-bold mt-1.5 text-sm">
                  {activeAbonnement?.plan
                    ? `Facturé à ${activeAbonnement.plan.prix.toLocaleString("fr-FR")} FCFA / mois`
                    : "Plan Gratuit de démarrage"}
                </p>
              </div>
              <Badge
                className={`text-xs font-black px-4 py-2 rounded-xl uppercase tracking-widest ${
                  quotas.statut === "ACTIF"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : quotas.statut === "ESSAI"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                }`}
                variant="outline"
              >
                {quotas.statut === "ACTIF"
                  ? "Actif"
                  : quotas.statut === "ESSAI"
                  ? "Période d'essai"
                  : "Expiré"}
              </Badge>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 pt-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                <div className="h-12 w-12 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Date de début</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {activeAbonnement
                      ? new Date(activeAbonnement.dateDebut).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                <div className="h-12 w-12 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
                  <CreditCard className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Prochaine facture</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {activeAbonnement?.dateFin
                      ? new Date(activeAbonnement.dateFin).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                      : activeAbonnement?.essaiFin
                      ? new Date(activeAbonnement.essaiFin).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                      : "Jamais"}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Inclus dans votre forfait</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {quotas.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 leading-tight">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quotas */}
          <div className="space-y-4">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Layers className="h-5 w-5 text-brand" /> Quotas & Utilisation
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <QuotaIndicator label="Boutiques" count={boutiqueLimit.count} max={boutiqueLimit.max} />
              <QuotaIndicator label="Produits (Actuelle)" count={produitLimit.count} max={produitLimit.max} />
              <QuotaIndicator label="Membres" count={membreLimit.count} max={membreLimit.max} />
            </div>
          </div>

          {/* Transactions Mobile view (Cards) vs Desktop view (Table) */}
          <div className="space-y-4">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <History className="h-5 w-5 text-brand" /> Historique de Paiement
            </h2>
            
            <div className="rounded-3xl sm:rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
              {payments.length > 0 ? (
                <>
                  {/* Desktop Table (hidden on mobile) */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                          <th className="py-4 px-6">Référence</th>
                          <th className="py-4 px-6">Date</th>
                          <th className="py-4 px-6">Montant</th>
                          <th className="py-4 px-6">Méthode</th>
                          <th className="py-4 px-6 text-right">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                        {payments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors text-sm font-bold">
                            <td className="py-4 px-6 text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">
                              {payment.transactionRef || payment.id.toUpperCase()}
                              <div className="text-[10px] text-zinc-400 mt-1">{payment.abonnement.plan.nom}</div>
                            </td>
                            <td className="py-4 px-6 text-zinc-600 dark:text-zinc-400">
                              {new Date(payment.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                            </td>
                            <td className="py-4 px-6 font-black text-zinc-900 dark:text-zinc-100">
                              {payment.montant.toLocaleString()} FCFA
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400">
                                {payment.methode === "STRIPE" ? <CreditCard className="h-3 w-3 text-brand" /> : <Smartphone className="h-3 w-3 text-brand" />}
                                {payment.methode}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <PaymentStatusBadge status={payment.statut} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards (hidden on desktop) */}
                  <div className="sm:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                    {payments.map((payment) => (
                      <div key={payment.id} className="p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">{payment.montant.toLocaleString()} FCFA</p>
                            <p className="text-xs font-bold text-zinc-500 mt-0.5">{payment.abonnement.plan.nom}</p>
                          </div>
                          <PaymentStatusBadge status={payment.statut} />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          <span>{new Date(payment.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
                          <span className="flex items-center gap-1">
                            {payment.methode === "STRIPE" ? <CreditCard className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
                            {payment.methode}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                  <div className="h-16 w-16 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-4">
                    <History className="h-6 w-6 text-zinc-400" />
                  </div>
                  <h3 className="font-black text-zinc-900 dark:text-zinc-100 text-lg">Aucun paiement</h3>
                  <p className="text-sm text-zinc-500 font-semibold mt-1 max-w-sm">Vos factures apparaîtront ici dès que vous aurez effectué votre première transaction.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1/3): FAQ & Support */}
        <div className="space-y-6">
          <div className="rounded-3xl sm:rounded-[2.5rem] bg-zinc-950 p-6 sm:p-10 text-white shadow-xl">
            <h3 className="text-lg font-black flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
              <HelpCircle className="h-5 w-5 text-brand" /> FAQ
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <h5 className="font-extrabold text-sm text-zinc-100">Comment changer de forfait ?</h5>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">Cliquez sur &quot;Mettre à niveau&quot; pour choisir un nouveau plan et effectuer le règlement via Mobile Money (Wave, OM) ou par Carte Bancaire.</p>
              </div>
              <div className="space-y-2">
                <h5 className="font-extrabold text-sm text-zinc-100">Puis-je annuler à tout moment ?</h5>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">Oui, absolument. Si vous avez souscrit via Stripe, vous pouvez gérer et résilier votre abonnement directement via le bouton de redirection Stripe Billing portal.</p>
              </div>
              <div className="space-y-2">
                <h5 className="font-extrabold text-sm text-zinc-100">Que se passe-t-il si je dépasse mes quotas ?</h5>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">Vos données restent en sécurité, mais vous ne pourrez plus ajouter de nouveaux éléments (produits, membres) avant d&apos;avoir fait de la place ou mis à niveau votre forfait.</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl sm:rounded-[2.5rem] bg-brand/5 border border-brand/10 space-y-4">
            <h4 className="font-black text-xs uppercase tracking-widest text-brand">Support Client</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold leading-relaxed">
              Des questions concernant un paiement ou besoin d'une solution sur mesure ? Notre équipe vous répond sous 24h ouvrées.
            </p>
            <Button asChild variant="outline" className="w-full h-12 font-black rounded-xl border-brand/20 hover:bg-brand hover:text-white transition-all text-xs">
              <a href="mailto:support@gestionpro.app">
                Contacter le Support <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
