import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { resolveVendeurId, getBoutiqueAccess } from "@/lib/permissions";
import { BoutiqueProvider } from "@/components/layouts/boutique-provider";
import { SupportWidget } from "@/components/support/support-widget";
import { TrialBanner, TrialExpiredScreen } from "@/components/dashboard/trial-status";
import { getBoutiqueOwnerQuotas } from "@/lib/quotas";

interface BoutiqueLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function BoutiqueLayout({
  children,
  params,
}: BoutiqueLayoutProps) {
  const { id } = await params;

  // ── Garde d'accès CENTRAL (corrige l'IDOR / OWASP A01) ──────────────────
  // Toutes les routes /boutiques/[id]/* passent par ce layout. Sans ce contrôle,
  // un simple `auth()` suffisait : n'importe quel utilisateur connecté pouvait
  // lire le tableau de bord, les finances et les clients d'une AUTRE boutique en
  // connaissant son id. On exige ici que l'utilisateur soit MEMBRE de la boutique
  // (table MembreBoutique) ; sinon notFound() — on ne révèle même pas son
  // existence. L'impersonation admin reste valable (la session reflète le vendeur).
  const session = await auth();
  if (!session?.user) redirect("/login");
  const vendeurId = await resolveVendeurId(session.user.id, session.user.vendeurId);
  if (!vendeurId) notFound();
  const access = await getBoutiqueAccess(id, vendeurId);
  if (!access) notFound();

  const vendeur = await prisma.vendeur.findUnique({
    where: { id: vendeurId },
    select: { nom: true, prenom: true, email: true },
  });

  const [boutique, quotas] = await Promise.all([
    prisma.boutique.findUnique({
      where: { id },
      select: {
        id: true,
        nom: true,
        slug: true,
        logo: true,
        secteurActivite: true,
        description: true,
      },
    }),
    getBoutiqueOwnerQuotas(id),
  ]);

  if (!boutique) {
    notFound();
  }

  // ── FIN D'ESSAI = BLOCAGE SERVEUR de toutes les pages /boutiques/[id]/* ──
  // Vérifié à CHAQUE requête (l'expiration est détectée à la lecture des
  // quotas, y compris en session déjà ouverte). Les données restent intactes ;
  // la souscription d'un forfait (page /pricing, hors de ce layout) redonne
  // l'accès immédiatement. Le widget support reste monté ci-dessous.
  const isBlocked = !quotas.isActive;

  // Indicateur d'essai : jours restants (arrondi supérieur), visible pendant l'ESSAI.
  const trialDaysLeft =
    !isBlocked && quotas.statut === "ESSAI" && quotas.essaiFin
      ? Math.max(0, Math.ceil((quotas.essaiFin.getTime() - Date.now()) / 86_400_000))
      : null;

  return (
    <BoutiqueProvider
      boutique={{
        ...boutique,
        plan: {
          codePlan: quotas.codePlan as "STARTER" | "PRO" | "ENTERPRISE",
          nom: quotas.nom,
          isActive: quotas.isActive,
        },
      }}
    >
      {trialDaysLeft !== null && <TrialBanner daysLeft={trialDaysLeft} />}
      {isBlocked ? <TrialExpiredScreen boutiqueId={id} /> : children}
      {/* Messagerie support vendeur — au-dessus de la bottom-nav mobile,
          à gauche (le FAB d'action est à droite). */}
      <SupportWidget
        variant="vendeur"
        prefill={{
          nom: `${vendeur?.prenom ?? ""} ${vendeur?.nom ?? ""}`.trim(),
          email: vendeur?.email ?? "",
        }}
        boutiqueId={id}
        offsetClass="bottom-24 sm:bottom-4"
      />
    </BoutiqueProvider>
  );
}
