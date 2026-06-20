"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authActionClient } from "@/lib/safe-action";

/** Liste des 20 notifications les plus récentes de l'utilisateur + compteur non-lus. */
export const getNotifications = authActionClient.action(async ({ ctx }) => {
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({
      where: { userId: ctx.user.id, read: false },
    }),
  ]);
  return { items, unread };
});

/** Marque une notification comme lue (scopée à l'utilisateur). */
export const markNotificationRead = authActionClient
  .schema(z.object({ id: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    await prisma.notification.updateMany({
      where: { id: parsedInput.id, userId: ctx.user.id },
      data: { read: true },
    });
    return { success: true };
  });

/** Marque toutes les notifications de l'utilisateur comme lues. */
export const markAllNotificationsRead = authActionClient.action(async ({ ctx }) => {
  await prisma.notification.updateMany({
    where: { userId: ctx.user.id, read: false },
    data: { read: true },
  });
  return { success: true };
});
