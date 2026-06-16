import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBoutiqueAccess, resolveVendeurId } from "@/lib/permissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ boutiqueId: string; produitId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { boutiqueId, produitId } = await params;

  // Authorization: the user must be a member of this boutique. Filtering by
  // boutiqueId is not enough — without this, any authenticated user could read
  // another shop's catalogue (cost prices, stock) by guessing IDs.
  const vendeurId = await resolveVendeurId(session.user.id, session.user.vendeurId);
  if (!vendeurId || !(await getBoutiqueAccess(boutiqueId, vendeurId))) {
    return NextResponse.json({ error: "Accès refusé à cette boutique." }, { status: 403 });
  }

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
