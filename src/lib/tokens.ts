import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Hache un token (SHA-256) pour le stockage en base. Le token n'est JAMAIS
 * stocké en clair : seul son hash l'est, et le token brut ne vit que dans
 * l'email envoyé. Une fuite de la base ne permet donc pas de réutiliser un
 * lien de vérification ou de réinitialisation actif.
 */
export const hashToken = (rawToken: string): string =>
  crypto.createHash("sha256").update(rawToken).digest("hex");

export const generateVerificationToken = async (email: string) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const token = hashToken(rawToken);
  // 24 h : aligné sur le flux d'inscription en attente (pending_registrations),
  // pour que l'e-mail de vérification annonce la même durée sur TOUS les chemins.
  const expires = new Date(Date.now() + 24 * 3600 * 1000); // 24 heures

  const existingToken = await prisma.verificationToken.findFirst({
    where: { identifier: email },
  });

  if (existingToken) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: existingToken.identifier,
          token: existingToken.token,
        },
      },
    });
  }

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  // On renvoie le token BRUT (pour le lien de l'email), pas le hash stocké.
  return { identifier: email, token: rawToken };
};

export const generatePasswordResetToken = async (email: string) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const token = hashToken(rawToken);
  const expires = new Date(Date.now() + 3600 * 1000); // 1 heure

  const existingToken = await prisma.passwordResetToken.findFirst({
    where: { identifier: email },
  });

  if (existingToken) {
    await prisma.passwordResetToken.delete({
      where: {
        identifier_token: {
          identifier: existingToken.identifier,
          token: existingToken.token,
        },
      },
    });
  }

  await prisma.passwordResetToken.create({
    data: { identifier: email, token, expires },
  });

  return { identifier: email, token: rawToken };
};
