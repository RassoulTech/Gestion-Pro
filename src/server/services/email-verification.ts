import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { logActivity } from "@/lib/activity-log";

export type VerifyEmailResult =
  | { status: "success"; email: string }
  | { status: "invalid" }
  | { status: "expired" };

/**
 * Valide un token de vérification d'email (usage unique, expirant) et persiste
 * l'état "vérifié" en base.
 *
 * Logique partagée entre :
 * - la route serveur GET `/api/verify-email` (lien cliqué dans l'email), et
 * - la server action `verifyEmail` (compat. anciens liens / appels client).
 *
 * Le token reçu est BRUT ; il est re-haché (SHA-256) avant comparaison, comme à
 * la génération — jamais stocké en clair.
 */
export async function verifyEmailToken(
  rawToken: string
): Promise<VerifyEmailResult> {
  await logActivity({
    action: "VERIFICATION_LINK_CLICKED",
    changes: { token: hashToken(rawToken) },
  });

  const existingToken = await prisma.verificationToken.findFirst({
    where: { token: hashToken(rawToken) },
  });

  if (!existingToken) {
    return { status: "invalid" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    return { status: "expired" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: existingToken.identifier },
  });

  if (!existingUser) {
    return { status: "invalid" };
  }

  await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      emailVerified: new Date(),
      email: existingToken.identifier, // fallback si l'email a changé
    },
  });

  // Anti-rejeu : le token est à usage unique.
  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: existingToken.identifier,
        token: existingToken.token,
      },
    },
  });

  await logActivity({
    userId: existingUser.id,
    action: "ACCOUNT_ACTIVATED",
    changes: { email: existingUser.email },
  });

  return { status: "success", email: existingUser.email };
}
