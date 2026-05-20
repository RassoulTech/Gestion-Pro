import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { env } from "@/env.mjs";
import { clearQuotaCache } from "@/lib/quotas";
import {
  sendSubscriptionExpiredEmail,
  sendSubscriptionRenewalReminderEmail,
} from "@/lib/mail";

const REMINDER_WINDOW_DAYS = 3;

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function GET(request: Request) {
  // CRON_SECRET MUST be configured. No hardcoded fallback — a missing secret
  // would expose this endpoint to anyone and allow forced trial expirations.
  const cronSecret = env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 16) {
    console.error("expire-trials: CRON_SECRET is missing or too short");
    return NextResponse.json(
      { error: "Server misconfiguration: CRON_SECRET is not set" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret") ?? "";

  const expectedHeader = `Bearer ${cronSecret}`;
  const isAuthorized =
    timingSafeEqualStr(authHeader, expectedHeader) ||
    timingSafeEqualStr(querySecret, cronSecret);

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing CRON_SECRET" },
      { status: 401 }
    );
  }

  try {
    const now = new Date();
    const reminderWindowEnd = new Date(
      now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000
    );

    // ─── STEP 1 ─ Send reminders for subscriptions expiring within REMINDER_WINDOW_DAYS ───
    const upcomingExpirations = await prisma.abonnement.findMany({
      where: {
        statut: { in: ["ESSAI", "ACTIF"] },
        lastReminderAt: null,
        OR: [
          {
            statut: "ESSAI",
            essaiFin: { gte: now, lte: reminderWindowEnd },
          },
          {
            statut: "ACTIF",
            dateFin: { gte: now, lte: reminderWindowEnd },
          },
        ],
      },
      include: {
        plan: true,
        vendeur: {
          include: {
            user: { select: { email: true, name: true } },
            boutiques: { select: { id: true }, take: 1 },
          },
        },
      },
    });

    let remindersSent = 0;
    for (const abo of upcomingExpirations) {
      const expiresAt =
        abo.statut === "ESSAI" ? abo.essaiFin : abo.dateFin;
      if (!expiresAt) continue;

      const email = abo.vendeur?.user?.email;
      if (!email) continue;

      const result = await sendSubscriptionRenewalReminderEmail({
        email,
        vendeurName: abo.vendeur?.user?.name,
        planName: abo.plan.nom,
        expiresAt,
        amount: abo.montant,
        boutiqueId: abo.vendeur?.boutiques[0]?.id ?? null,
      });

      if (result.sent) {
        remindersSent += 1;
        await prisma.abonnement.update({
          where: { id: abo.id },
          data: { lastReminderAt: now },
        });
      }
    }

    // ─── STEP 2 ─ Expire subscriptions whose dateFin/essaiFin is past ───
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
      include: {
        plan: true,
        vendeur: {
          include: {
            user: { select: { email: true, name: true } },
            boutiques: { select: { id: true }, take: 1 },
          },
        },
      },
    });

    let expiredCount = 0;
    let expiredEmailsSent = 0;

    if (expiredAbonnements.length > 0) {
      const result = await prisma.abonnement.updateMany({
        where: {
          id: { in: expiredAbonnements.map((a) => a.id) },
        },
        data: {
          statut: "EXPIRE",
        },
      });
      expiredCount = result.count;

      for (const abo of expiredAbonnements) {
        clearQuotaCache(abo.vendeurId);

        const email = abo.vendeur?.user?.email;
        if (!email) continue;

        const expiredAt =
          abo.statut === "ESSAI" ? abo.essaiFin : abo.dateFin;

        const mailResult = await sendSubscriptionExpiredEmail({
          email,
          vendeurName: abo.vendeur?.user?.name,
          planName: abo.plan.nom,
          expiresAt: expiredAt ?? now,
          amount: abo.montant,
          boutiqueId: abo.vendeur?.boutiques[0]?.id ?? null,
        });

        if (mailResult.sent) {
          expiredEmailsSent += 1;
        }
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent,
      expiredCount,
      expiredEmailsSent,
      expiredIds: expiredAbonnements.map((a) => a.id),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error processing expire-trials cron:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    );
  }
}
