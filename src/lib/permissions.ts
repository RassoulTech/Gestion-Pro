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
 * Resolve a vendeurId from the session, falling back to the DB when the JWT
 * is out of sync (Google OAuth signin, profile created after token issuance…).
 * Mirrors the fallback used by vendeurActionClient. Returns null when the user
 * has no vendeur profile. Use this in route handlers before getBoutiqueAccess.
 */
export async function resolveVendeurId(
  userId: string,
  sessionVendeurId: string | null | undefined
): Promise<string | null> {
  if (sessionVendeurId) return sessionVendeurId;
  const vendeur = await prisma.vendeur.findUnique({
    where: { userId },
    select: { id: true },
  });
  return vendeur?.id ?? null;
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
