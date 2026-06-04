import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAiQuotaState } from "@/lib/ai/quota";
import { getAiHistory } from "@/server/queries/ai.queries";
import { getAiMode } from "@/lib/ai/provider";
import { AssistantClient } from "./_components/assistant-client";

export const metadata: Metadata = { title: "Assistant IA" };

export default async function AssistantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const vendeur = await prisma.vendeur.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!vendeur) notFound();

  const [quota, history] = await Promise.all([
    getAiQuotaState(session.user.id, vendeur.id),
    getAiHistory(session.user.id, id),
  ]);

  const isMock = getAiMode() === "mock";

  return (
    <div className="space-y-5 pb-24 sm:pb-10">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/10">
          <Sparkles className="h-3 w-3 text-brand" />
          <span className="text-[10px] font-black uppercase tracking-widest text-brand">Assistant IA Commerce</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Assistant IA</h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium text-xs sm:text-sm">
          Gagnez du temps : créez des produits, améliorez vos descriptions et interrogez vos données en langage naturel.
        </p>
      </div>

      <AssistantClient
        boutiqueId={id}
        isMock={isMock}
        quota={quota}
        history={history.map((h) => ({
          id: h.id,
          type: h.type,
          prompt: h.prompt,
          response: h.response,
          createdAt: h.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
