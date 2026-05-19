import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/env.mjs";
import { clearQuotaCache } from "@/lib/quotas";

export async function GET(request: Request) {
  // 1. Authorization check
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");

  const cronSecret = env.CRON_SECRET || "super-secret-cron-token-xyz";

  // Accept either "Authorization: Bearer <secret>" or "?secret=<secret>"
  const isAuthorized =
    authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret;

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing CRON_SECRET" },
      { status: 401 }
    );
  }

  try {
    const now = new Date();

    // 2. Find all active or trial subscriptions that have expired
    const expiredAbonnements = await prisma.abonnement.findMany({
      where: {
        statut: { in: ["ESSAI", "ACTIF"] },
        OR: [
          {
            statut: "ESSAI",
            essaiFin: { lt: now },
          },
          {
            statut: "ACTIF",
            dateFin: { lt: now },
          },
        ],
      },
      select: {
        id: true,
        vendeurId: true,
        statut: true,
      },
    });

    if (expiredAbonnements.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired subscriptions found.",
        count: 0,
      });
    }

    // 3. Mark them as expired
    const updatedCount = await prisma.abonnement.updateMany({
      where: {
        id: { in: expiredAbonnements.map((a) => a.id) },
      },
      data: {
        statut: "EXPIRE",
      },
    });

    // 4. Invalidate the memory cache for all affected vendors
    for (const abonnement of expiredAbonnements) {
      clearQuotaCache(abonnement.vendeurId);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed and expired ${updatedCount.count} subscription(s).`,
      count: updatedCount.count,
      expiredIds: expiredAbonnements.map((a) => a.id),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error processing expired subscriptions cron:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    );
  }
}
