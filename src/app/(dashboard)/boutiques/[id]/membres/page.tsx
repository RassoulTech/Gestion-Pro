import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/status-badge";
import { getInitials } from "@/lib/utils";
import { Users } from "lucide-react";
import { PremiumGuard } from "@/components/dashboard/premium-guard";
import { getBoutiqueOwnerQuotas } from "@/lib/quotas";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.pages");
  return { title: t("membersTitle") };
}

const avatarColors = [
  "bg-brand/10 text-brand",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
];

export default async function MembresPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: boutiqueId } = await params;
  const t = await getTranslations("dashboard.pages");

  const [membres, quotas] = await Promise.all([
    prisma.membreBoutique.findMany({
      where: { boutiqueId },
      include: {
        vendeur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            user: { select: { name: true, email: true, image: true } }
          }
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    getBoutiqueOwnerQuotas(boutiqueId),
  ]);

  return (
    <div className="space-y-5 sm:space-y-8 pb-6 sm:pb-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t("membersTitle")}</h1>
        <p className="text-sm text-muted-foreground font-medium">{t("membersSubtitle")}</p>
      </div>

      <PremiumGuard
        currentPlanName={quotas.nom}
        featureName="Équipe & Multi-utilisateurs"
        featureDescription="Invitez plusieurs collaborateurs (jusqu'à 5 avec Pro, illimité avec Enterprise) pour gérer votre boutique en équipe."
      >
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {membres.map((m, index) => (
            <Card key={m.id} className="border-none shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] bg-white dark:bg-zinc-900">
              <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className={`font-black text-sm ${avatarColors[index % avatarColors.length]}`}>
                    {getInitials(m.vendeur.user.name || m.vendeur.nom)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">
                    {m.vendeur.nom} {m.vendeur.prenom}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {m.vendeur.user.email}
                  </p>
                </div>
                <StatusBadge status={m.role} />
              </CardContent>
            </Card>
          ))}
        </div>

        {membres.length === 0 && (
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-zinc-900">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="font-bold text-lg">Aucun membre</p>
              <p className="text-muted-foreground font-medium">Les membres de votre équipe apparaîtront ici.</p>
            </CardContent>
          </Card>
        )}
      </PremiumGuard>
    </div>
  );
}
