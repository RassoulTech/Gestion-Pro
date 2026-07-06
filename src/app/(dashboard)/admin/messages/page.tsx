import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { auth, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { MessagesClient } from "./_components/messages-client";

export const metadata: Metadata = { title: "Messages — Admin" };

const PAGE_SIZE = 20;

/** Boîte de réception support (visiteurs + vendeurs) — admin uniquement. */
export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; type?: string; motif?: string; q?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  await requireRole("ADMIN");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where: Prisma.ContactMessageWhereInput = {
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

  const [messages, total, nouveaux] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: { replies: { orderBy: { createdAt: "asc" } } },
    }),
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
          statut: m.statut,
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
