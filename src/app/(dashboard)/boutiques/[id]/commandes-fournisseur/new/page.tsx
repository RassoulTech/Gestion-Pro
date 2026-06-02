import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NouvelAchatClient } from "./_components/nouvel-achat-client";

interface NouvelAchatPageProps {
  params: Promise<{ id: string }>;
}

export default async function NouvelAchatPage({ params }: NouvelAchatPageProps) {
  const { id: boutiqueId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Fetch products and suppliers for this boutique
  const [produits, fournisseurs] = await Promise.all([
    prisma.produit.findMany({
      where: { boutiqueId },
      select: {
        id: true,
        nom: true,
        code: true,
        prixAchat: true,
        prixUnitaire: true,
        quantite: true,
      },
      orderBy: { nom: "asc" },
    }),
    prisma.fournisseur.findMany({
      where: { boutiqueId },
      select: {
        id: true,
        nom: true,
        telephone: true,
      },
      orderBy: { nom: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <NouvelAchatClient
        boutiqueId={boutiqueId}
        initialProduits={produits}
        initialFournisseurs={fournisseurs}
      />
    </div>
  );
}
