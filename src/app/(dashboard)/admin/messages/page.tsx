import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { auth, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { markNotificationsSeen } from "@/server/services/notifications";
import { NotifsRefreshPing } from "@/components/notifications/notifs-refresh-ping";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { MessagesClient } from "./_components/messages-client";

export const metadata: Metadata = { title: "Messages — Admin" };

const PAGE_SIZE = 20;

/** Boîte de réception support (visiteurs + vendeurs) — admin uniquement. */
export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; type?: string; motif?: string; q?: string; page?: string; p?: string; du?: string; au?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  await requireRole("ADMIN");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  // Période : URL (local) > filtre global de session > défaut 30 j.
  const { cookies } = await import("next/headers");
  const { GLOBAL_FILTER_COOKIE_ADMIN, resolveCanonicalParams } = await import("@/lib/global-filter");
  const { resolvePeriod } = await import("@/lib/periods");
  const cookieRaw = (await cookies()).get(GLOBAL_FILTER_COOKIE_ADMIN)?.value;
  const eff = resolveCanonicalParams(sp, cookieRaw ? decodeURIComponent(cookieRaw) : undefined, "30j");
  const period = resolvePeriod(eff.p, eff.du, eff.au);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const where: Prisma.ContactMessageWhereInput = {
    createdAt: { gte: period.from, lte: period.to },
    ...(sp.statut ? { statut: sp.statut } : {}),
    ...(sp.type ? { senderType: sp.type } : {}),
    ...(sp.motif ? { motif: sp.motif } : {}),
    ...(sp.q
      ? {
          OR: [
            { nom: { contains: sp.q, mode: "insensitive" } },
            { email: { contains: sp.q, mode: "insensitive" } },
            { message: { contains: sp.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const messages = await prisma.contactMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
    include: { replies: { orderBy: { createdAt: "asc" } } },
  });

  // ── « LU AU PASSAGE » (type WhatsApp) ─────────────────────────────────
  // Entrer sur la page suffit : les messages AFFICHÉS (cette page uniquement —
  // précision pagination) passent NOUVEAU→LU, persisté immédiatement. Les
  // statuts de traitement (RÉPONDU/ARCHIVÉ) ne sont jamais touchés ici.
  const seenNewIds = messages.filter((m) => m.statut === "NOUVEAU").map((m) => m.id);
  if (seenNewIds.length > 0) {
    await prisma.contactMessage.updateMany({
      where: { id: { in: seenNewIds }, statut: "NOUVEAU" },
      data: { statut: "LU", lu: true },
    });
  }
  // La cloche : les alertes « nouveau message » sont considérées vues dès
  // l'entrée dans la boîte de réception.
  await markNotificationsSeen(["MESSAGE_CONTACT"]);

  const [total, nouveaux] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.count({ where: { statut: "NOUVEAU" } }),
  ]);

  // Historique par contact (nb de messages du même e-mail) + infos boutique.
  const emails = [...new Set(messages.map((m) => m.email))];
  const boutiqueIds = [...new Set(messages.map((m) => m.boutiqueId).filter(Boolean))] as string[];
  const [historyCounts, boutiques] = await Promise.all([
    prisma.contactMessage.groupBy({ by: ["email"], where: { email: { in: emails } }, _count: true }),
    boutiqueIds.length
      ? prisma.boutique.findMany({ where: { id: { in: boutiqueIds } }, select: { id: true, nom: true } })
      : Promise.resolve([]),
  ]);
  const historyByEmail = Object.fromEntries(historyCounts.map((h) => [h.email, h._count]));
  const boutiqueById = Object.fromEntries(boutiques.map((b) => [b.id, b.nom]));

  return (
    <div className="space-y-6 p-3 sm:p-6 pb-24">
      <NotifsRefreshPing />
      <PeriodFilter active={period.key} from={iso(period.from)} to={iso(period.to)} source={eff.source} />
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Messages</h1>
          <p className="text-xs font-semibold text-zinc-500">
            {nouveaux > 0 ? `${nouveaux} nouveau${nouveaux > 1 ? "x" : ""} message${nouveaux > 1 ? "s" : ""}` : "Aucun nouveau message"} · {total} au total
          </p>
        </div>
      </div>

      <MessagesClient
        messages={messages.map((m) => ({
          id: m.id,
          nom: m.nom,
          email: m.email,
          telephone: m.telephone,
          senderType: m.senderType,
          motif: m.motif ?? m.sujet,
          message: m.message,
          // Statut persisté (déjà passé LU au passage) + drapeau pour la
          // transition douce « nouveau → lu » à l'écran.
          statut: m.statut === "NOUVEAU" ? "LU" : m.statut,
          wasNew: m.statut === "NOUVEAU",
          createdAt: m.createdAt.toISOString(),
          vendeurId: m.vendeurId,
          boutiqueId: m.boutiqueId,
          boutiqueNom: m.boutiqueId ? (boutiqueById[m.boutiqueId] ?? null) : null,
          historyCount: historyByEmail[m.email] ?? 1,
          replies: m.replies.map((r) => ({ id: r.id, body: r.body, createdAt: r.createdAt.toISOString() })),
        }))}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        filters={{ statut: sp.statut ?? "", type: sp.type ?? "", motif: sp.motif ?? "", q: sp.q ?? "" }}
      />
    </div>
  );
}
