import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
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

  const [boutique, quotas] = await Promise.all([
    prisma.boutique.findUnique({
      where: { id },
      select: {
        id: true,
        nom: true,
        slug: true,
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
