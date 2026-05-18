import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ boutiqueId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { boutiqueId } = await params;

  const categories = await prisma.categorie.findMany({
    where: { boutiqueId },
    select: { id: true, nom: true },
    orderBy: { nom: "asc" },
  });

  return NextResponse.json(categories);
}
