import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { resolveVendeurId, getBoutiqueAccess } from "@/lib/permissions";
import { BoutiqueProvider } from "@/components/layouts/boutique-provider";
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
      {children}
    </BoutiqueProvider>
  );
}
