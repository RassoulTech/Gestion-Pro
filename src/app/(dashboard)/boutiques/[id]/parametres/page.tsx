import React from "react";
import { redirect, notFound } from "next/navigation";
import { Settings, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import {
  getBoutiqueForSettings,
  getVendeurForSettings,
  getRecentActivityForUser,
  getCommandeCountForBoutique,
} from "@/server/queries/boutique.queries";
import {
  getVendeurQuotas,
  checkBoutiqueCreationLimit,
  checkProduitCreationLimit,
  checkMembreCreationLimit,
} from "@/lib/quotas";
import { SectionProfil } from "./_components/section-profil";
import { SectionBoutique } from "./_components/section-boutique";
import { SectionCompte } from "./_components/section-compte";
import { SectionSecurite } from "./_components/section-securite";
import { SectionAbonnement } from "./_components/section-abonnement";
import { SectionNotifications } from "./_components/section-notifications";
import { SectionPreferences } from "./_components/section-preferences";
import { SectionExport } from "./_components/section-export";
import { SectionDanger } from "./_components/section-danger";
import { ParametresTabs } from "./_components/parametres-tabs";

interface PageProps {
  params: Promise<{ id: string }>;
}

type NotifShape = { commandes: boolean; ventes: boolean; clients: boolean; paiements: boolean; rapports: boolean; emails: boolean };
type PrefShape = { langue: string; timezone: string; dateFormat: string; currencyFormat: string };

const DEFAULT_NOTIFS: NotifShape = {
  commandes: true, ventes: true, clients: true, paiements: true, rapports: true, emails: true,
};

const DEFAULT_PREFS: PrefShape = {
  langue: "fr", timezone: "UTC", dateFormat: "DD/MM/YYYY", currencyFormat: "FCFA",
};

function parseNotifs(raw: unknown): NotifShape {
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    return {
      commandes: typeof r.commandes === "boolean" ? r.commandes : DEFAULT_NOTIFS.commandes,
      ventes: typeof r.ventes === "boolean" ? r.ventes : DEFAULT_NOTIFS.ventes,
      clients: typeof r.clients === "boolean" ? r.clients : DEFAULT_NOTIFS.clients,
      paiements: typeof r.paiements === "boolean" ? r.paiements : DEFAULT_NOTIFS.paiements,
      rapports: typeof r.rapports === "boolean" ? r.rapports : DEFAULT_NOTIFS.rapports,
      emails: typeof r.emails === "boolean" ? r.emails : DEFAULT_NOTIFS.emails,
    };
  }
  return DEFAULT_NOTIFS;
}

function parsePrefs(raw: unknown): PrefShape {
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    return {
      langue: typeof r.langue === "string" ? r.langue : DEFAULT_PREFS.langue,
      timezone: typeof r.timezone === "string" ? r.timezone : DEFAULT_PREFS.timezone,
      dateFormat: typeof r.dateFormat === "string" ? r.dateFormat : DEFAULT_PREFS.dateFormat,
      currencyFormat: typeof r.currencyFormat === "string" ? r.currencyFormat : DEFAULT_PREFS.currencyFormat,
    };
  }
  return DEFAULT_PREFS;
}

export default async function ParametresPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [boutique, vendeur] = await Promise.all([
    getBoutiqueForSettings(id),
    getVendeurForSettings(session.user.id),
  ]);

  if (!boutique || !vendeur) notFound();

  const [quotas, activeAbonnement, boutiqueLimit, produitLimit, membreLimit, commandeCount, activity] = await Promise.all([
    getVendeurQuotas(vendeur.id),
    prisma.abonnement.findFirst({
      where: { vendeurId: vendeur.id, statut: { in: ["ESSAI", "ACTIF"] } },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    checkBoutiqueCreationLimit(vendeur.id),
    checkProduitCreationLimit(id, vendeur.id),
    checkMembreCreationLimit(id, vendeur.id),
    getCommandeCountForBoutique(id),
    getRecentActivityForUser(session.user.id, 8),
  ]);

  const notifs = parseNotifs(vendeur.notifications);
  const prefs = parsePrefs(vendeur.preferences);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/10">
            <Sparkles className="h-3 w-3 text-brand" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand">Centre de paramètres</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6" /> Paramètres
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-xs sm:text-sm">
            Gérez votre profil, votre boutique, votre sécurité et tous vos préférences depuis un seul endroit.
          </p>
        </div>
      </div>

      <Card className="border-none bg-white dark:bg-zinc-900 shadow-xl rounded-[2rem]">
        <CardContent className="p-4 sm:p-6">
          <ParametresTabs
            sections={{
              profil: (
                <SectionProfil
                  initial={{
                    nom: vendeur.nom,
                    prenom: vendeur.prenom,
                    nomAffiche: vendeur.nomAffiche,
                    telephone: vendeur.telephone,
                    pays: vendeur.pays,
                    ville: vendeur.ville,
                    adresse: vendeur.adresse,
                    bio: vendeur.bio,
                    photo: vendeur.photo,
                  }}
                />
              ),
              boutique: (
                <SectionBoutique
                  boutiqueId={id}
                  initial={{
                    nom: boutique.nom,
                    description: boutique.description,
                    adresse: boutique.adresse,
                    siteWeb: boutique.siteWeb,
                    email: boutique.email,
                    telephone: boutique.telephone,
                    secteurActivite: boutique.secteurActivite,
                    logo: boutique.logo,
                    whatsapp: boutique.whatsapp,
                    facebook: boutique.facebook,
                    instagram: boutique.instagram,
                    linkedin: boutique.linkedin,
                    twitter: boutique.twitter,
                    horaires: boutique.horaires,
                  }}
                />
              ),
              compte: (
                <SectionCompte
                  initial={{
                    email: vendeur.user.email,
                    hasPassword: vendeur.user.hasPassword,
                  }}
                />
              ),
              securite: (
                <SectionSecurite
                  initial={{
                    accountCreatedAt: vendeur.user.createdAt,
                    lastUpdatedAt: vendeur.user.updatedAt,
                    activity,
                  }}
                />
              ),
              abonnement: (
                <SectionAbonnement
                  boutiqueId={id}
                  initial={{
                    planNom: quotas.nom,
                    planStatut: quotas.statut,
                    isActive: quotas.isActive,
                    dateDebut: activeAbonnement?.dateDebut ?? null,
                    dateFin: activeAbonnement?.dateFin ?? null,
                    essaiFin: activeAbonnement?.essaiFin ?? null,
                    montant: activeAbonnement?.plan.prix ?? 0,
                    quotas: {
                      produits: { count: produitLimit.count, max: produitLimit.max },
                      boutiques: { count: boutiqueLimit.count, max: boutiqueLimit.max },
                      membres: { count: membreLimit.count, max: membreLimit.max },
                      commandes: commandeCount,
                    },
                  }}
                />
              ),
              notifications: <SectionNotifications initial={notifs} />,
              preferences: <SectionPreferences initial={prefs} />,
              exportData: <SectionExport boutiqueId={id} />,
              danger: (
                <SectionDanger
                  boutiqueId={id}
                  boutiqueNom={boutique.nom}
                  boutiqueStatut={boutique.statut}
                />
              ),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
