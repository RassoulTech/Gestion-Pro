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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuotaIndicator } from "@/components/dashboard/quota-indicators";
import Link from "next/link";
import { ManageStripeButton } from "./_components/manage-stripe-button";
import { RenewSubscriptionButton } from "./_components/renew-subscription-button";

interface FacturationPageProps {
  params: Promise<{ id: string }>;
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
    <div className="space-y-10 pb-10">
      {/* Header / Hero */}
      <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] bg-zinc-950 p-6 sm:p-12 text-white shadow-2xl">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-brand/30 blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-slate-500/10 blur-[100px]" />

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand" />
              <span className="text-xs font-bold uppercase tracking-widest text-brand">
                Gestion de l&apos;Abonnement
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter">
              Facturation & Quotas
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 max-w-xl font-bold">
              Suivez l&apos;utilisation de vos ressources en temps réel et gérez vos moyens de paiement.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            {renewalNeeded && renewalPlanName && (
              <RenewSubscriptionButton
                planName={renewalPlanName}
                amount={renewalAmount}
                urgent={renewalUrgent}
              />
            )}

            <Button
              asChild
              size="lg"
              className="h-14 rounded-2xl px-8 font-black bg-brand hover:bg-brand/90 hover:scale-[1.02] transition-all"
            >
              <Link href={pricingUrl}>
                <TrendingUp className="mr-2 h-5 w-5" />
                Mettre à niveau
              </Link>
            </Button>

            {vendeur.stripeCustomerId && (
              <ManageStripeButton hasStripeCustomer={!!vendeur.stripeCustomerId} />
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left column: subscription status & Quotas info */}
        <div className="lg:col-span-8 space-y-8">
          {/* Active plan overview */}
          <Card className="border-none bg-white dark:bg-zinc-900 shadow-xl rounded-[2rem] p-6 sm:p-8 overflow-hidden relative">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-brand/5 blur-3xl" />
            
            <CardHeader className="p-0 pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-black tracking-tight">
                    Forfait Actuel : <span className="text-brand">{quotas.nom}</span>
                  </CardTitle>
                  <CardDescription className="text-zinc-500 font-bold mt-1">
                    {activeAbonnement?.plan
                      ? `Facturé à ${activeAbonnement.plan.prix.toLocaleString("fr-FR")} FCFA / mois`
                      : "Starter Gratuit"}
                  </CardDescription>
                </div>
                <Badge
                  className={`text-xs font-black px-4 py-1.5 rounded-full w-fit uppercase tracking-widest ${
                    quotas.statut === "ACTIF"
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : quotas.statut === "ESSAI"
                      ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse"
                      : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
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
            </CardHeader>

            <CardContent className="p-0 pt-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm">Début de l&apos;abonnement</h5>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                      {activeAbonnement
                        ? new Date(activeAbonnement.dateDebut).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm">Prochaine facturation</h5>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                      {activeAbonnement?.dateFin
                        ? new Date(activeAbonnement.dateFin).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : activeAbonnement?.essaiFin
                        ? new Date(activeAbonnement.essaiFin).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Jamais (Plan Starter)"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bullet features */}
              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-4">
                  Inclus dans votre forfait
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {quotas.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-zinc-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quotas Bento Grid */}
          <div className="space-y-4">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Layers className="h-5 w-5 text-brand" /> Utilisation des Ressources
            </h2>
            
            <div className="grid gap-4 sm:grid-cols-3">
              <QuotaIndicator
                label="Boutiques"
                count={boutiqueLimit.count}
                max={boutiqueLimit.max}
              />
              <QuotaIndicator
                label="Produits (Boutique actuelle)"
                count={produitLimit.count}
                max={produitLimit.max}
              />
              <QuotaIndicator
                label="Membres d'équipe"
                count={membreLimit.count}
                max={membreLimit.max}
              />
            </div>
          </div>

          {/* Transactions / Invoices history list */}
          <Card className="border-none bg-white dark:bg-zinc-900 shadow-xl rounded-[2rem] p-6 sm:p-8">
            <CardHeader className="p-0 pb-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                  <History className="h-5 w-5 text-brand" /> Historique des Paiements
                </CardTitle>
                <CardDescription className="text-zinc-500 font-bold mt-1">
                  Accédez à vos dernières factures et transactions.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                        <th className="py-3 pr-4">Référence</th>
                        <th className="py-3 px-4">Plan / Forfait</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Montant</th>
                        <th className="py-3 px-4">Méthode</th>
                        <th className="py-3 pl-4 text-right">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors text-sm font-bold">
                          <td className="py-4 pr-4 font-extrabold max-w-[120px] truncate text-slate-800 dark:text-zinc-200">
                            {payment.transactionRef || payment.id.toUpperCase()}
                          </td>
                          <td className="py-4 px-4 text-slate-600 dark:text-zinc-300">
                            {payment.abonnement.plan.nom}
                          </td>
                          <td className="py-4 px-4 text-zinc-500 font-semibold">
                            {new Date(payment.createdAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-4 px-4 font-black text-slate-800 dark:text-zinc-100">
                            {payment.montant.toLocaleString()} FCFA
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400">
                              {payment.methode === "STRIPE" ? (
                                <>
                                  <CreditCard className="h-3 w-3 text-brand" /> Stripe
                                </>
                              ) : (
                                <>
                                  <Smartphone className="h-3 w-3 text-brand" /> {payment.methode}
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-4 pl-4 text-right">
                            <Badge
                              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                                payment.statut === "CONFIRME"
                                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                  : payment.statut === "EN_ATTENTE"
                                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                              }`}
                              variant="outline"
                            >
                              {payment.statut === "CONFIRME"
                                ? "Confirmé"
                                : payment.statut === "EN_ATTENTE"
                                ? "En attente"
                                : "Échoué"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="font-extrabold text-slate-600 dark:text-zinc-400">Aucun paiement enregistré.</p>
                  <p className="text-xs text-muted-foreground font-semibold mt-1">
                    Vos factures apparaîtront ici dès que vous aurez effectué votre première transaction.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: help & FAQ */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none bg-zinc-950 text-white shadow-xl rounded-[2rem] p-6 sm:p-8">
            <CardHeader className="p-0 pb-6 border-b border-white/10">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-brand" /> FAQ - Facturation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-6 space-y-6">
              <div className="space-y-2">
                <h5 className="font-extrabold text-sm text-zinc-200">
                  Comment changer de forfait ?
                </h5>
                <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                  Cliquez sur le bouton &quot;Mettre à niveau&quot; pour choisir un nouveau plan et effectuer le règlement via Mobile Money (Wave, OM) ou par Carte Bancaire.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-extrabold text-sm text-zinc-200">
                  Puis-je annuler à tout moment ?
                </h5>
                <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                  Oui, absolument. Si vous avez souscrit via Stripe, vous pouvez gérer et résilier votre abonnement directement via le bouton de redirection Stripe Billing portal.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-extrabold text-sm text-zinc-200">
                  Que se passe-t-il si je dépasse mes quotas ?
                </h5>
                <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                  Vos données actuelles restent en sécurité, mais vous ne pourrez plus ajouter de nouveaux produits, boutiques ou collaborateurs avant d&apos;avoir fait de la place ou mis à niveau votre forfait.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick contact / Support info */}
          <div className="p-6 rounded-[2rem] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 space-y-3">
            <h4 className="font-black text-xs uppercase tracking-widest text-slate-800 dark:text-zinc-200">
              Besoin d&apos;aide supplémentaire ?
            </h4>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              Des questions concernant un paiement ou besoin d&apos;une solution sur mesure ? Notre équipe d&apos;assistance est prête à vous aider 24/7.
            </p>
            <Button
              asChild
              variant="outline"
              className="w-full h-11 font-black rounded-xl border-2 hover:scale-[1.02] transition-transform text-xs"
            >
              <a href="mailto:support@gestionpro.app">
                Contacter le Support
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
