import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ boutiqueId: string; produitId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { boutiqueId, produitId } = await params;

  const produit = await prisma.produit.findFirst({
    where: { id: produitId, boutiqueId },
    select: {
      id: true,
      nom: true,
      code: true,
      description: true,
      prixAchat: true,
      prixUnitaire: true,
      quantite: true,
      seuilAlerte: true,
      photo: true,
      categorieId: true,
    },
  });

  if (!produit) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }

  return NextResponse.json(produit);
}
