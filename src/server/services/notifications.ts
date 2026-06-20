import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Service de création de notifications.
 *
 * RÈGLE D'OR : best-effort. Toutes les fonctions avalent leurs erreurs — créer
 * une notification ne doit JAMAIS faire échouer le flux métier appelant
 * (commande, paiement, inscription…).
 */

export interface NotificationInput {
  type: string;
  title: string;
  message: string;
  link?: string | null;
  boutiqueId?: string | null;
}

/** Crée une notification pour un utilisateur précis. */
export async function notifyUser(userId: string, n: NotificationInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link ?? null,
        boutiqueId: n.boutiqueId ?? null,
      },
    });
  } catch (err) {
    console.error("[notifications] notifyUser:", err);
  }
}

/** Notifie le vendeur propriétaire d'une boutique. */
export async function notifyBoutiqueOwner(
  boutiqueId: string,
  n: NotificationInput
): Promise<void> {
  try {
    const boutique = await prisma.boutique.findUnique({
      where: { id: boutiqueId },
      select: { vendeur: { select: { userId: true } } },
    });
    const userId = boutique?.vendeur?.userId;
    if (userId) await notifyUser(userId, { ...n, boutiqueId });
  } catch (err) {
    console.error("[notifications] notifyBoutiqueOwner:", err);
  }
}

/** Notifie tous les administrateurs (une notification par admin). */
export async function notifyAdmins(n: NotificationInput): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    if (admins.length === 0) return;
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link ?? null,
        boutiqueId: n.boutiqueId ?? null,
      })),
    });
  } catch (err) {
    console.error("[notifications] notifyAdmins:", err);
  }
}
