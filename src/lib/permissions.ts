import { prisma } from "@/lib/prisma";
import type { RoleBoutique } from "@prisma/client";

export type BoutiqueContext = {
  boutiqueId: string;
  vendeurId: string;
  role: RoleBoutique;
};

/**
 * Verify that a vendeur has access to a boutique and return their context.
 * Always use this before any boutique-scoped operation.
 */
export async function getBoutiqueAccess(
  boutiqueId: string,
  vendeurId: string
): Promise<BoutiqueContext | null> {
  const membre = await prisma.membreBoutique.findUnique({
    where: {
      boutiqueId_vendeurId: { boutiqueId, vendeurId },
    },
  });

  if (!membre) return null;

  return {
    boutiqueId: membre.boutiqueId,
    vendeurId: membre.vendeurId,
    role: membre.role,
  };
}

export function isOwner(ctx: BoutiqueContext): boolean {
  return ctx.role === "OWNER";
}

/**
 * Ensure vendeur has access, throw if not.
 */
export async function requireBoutiqueAccess(
  boutiqueId: string,
  vendeurId: string
): Promise<BoutiqueContext> {
  const ctx = await getBoutiqueAccess(boutiqueId, vendeurId);
  if (!ctx) {
    throw new Error("BOUTIQUE_ACCESS_DENIED");
  }
  return ctx;
}

export async function requireBoutiqueOwner(
  boutiqueId: string,
  vendeurId: string
): Promise<BoutiqueContext> {
  const ctx = await requireBoutiqueAccess(boutiqueId, vendeurId);
  if (!isOwner(ctx)) {
    throw new Error("OWNER_ONLY");
  }
  return ctx;
}
