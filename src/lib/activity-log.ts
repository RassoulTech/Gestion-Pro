import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

type LogActivityParams = {
  userId?: string;
  action: string;
  subjectType?: string;
  subjectId?: string;
  changes?: Record<string, unknown>;
};

/**
 * Log d'activité non bloquant. Si quoi que ce soit échoue (DB injoignable,
 * permission, etc.), on swallow l'erreur — le log audit ne doit JAMAIS
 * faire échouer le flow utilisateur (inscription, etc.).
 */
export async function logActivity({
  userId,
  action,
  subjectType,
  subjectId,
  changes,
}: LogActivityParams) {
  try {
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = headersList.get("user-agent") ?? null;

    await prisma.activityLog.create({
      data: {
        userId,
        action,
        subjectType,
        subjectId,
        changes: (changes ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.warn("[activity-log] failed:", (error as Error).message);
  }
}
