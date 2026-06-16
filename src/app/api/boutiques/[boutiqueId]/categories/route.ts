import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBoutiqueAccess, resolveVendeurId } from "@/lib/permissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ boutiqueId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { boutiqueId } = await params;

  // Authorization: the user must be a member of this boutique, not merely
  // authenticated — otherwise any logged-in user could enumerate another
  // shop's categories by guessing its id.
  const vendeurId = await resolveVendeurId(session.user.id, session.user.vendeurId);
  if (!vendeurId || !(await getBoutiqueAccess(boutiqueId, vendeurId))) {
    return NextResponse.json({ error: "Accès refusé à cette boutique." }, { status: 403 });
  }

  const categories = await prisma.categorie.findMany({
    where: { boutiqueId },
    select: { id: true, nom: true },
    orderBy: { nom: "asc" },
  });

  return NextResponse.json(categories);
}
