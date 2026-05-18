import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BoutiqueProvider } from "@/components/layouts/boutique-provider";

interface BoutiqueLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function BoutiqueLayout({
  children,
  params,
}: BoutiqueLayoutProps) {
  const { id } = await params;

  const boutique = await prisma.boutique.findUnique({
    where: { id },
    select: {
      id: true,
      nom: true,
      slug: true,
    },
  });

  if (!boutique) {
    notFound();
  }

  return (
    <BoutiqueProvider boutique={boutique}>
      {children}
    </BoutiqueProvider>
  );
}
