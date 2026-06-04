import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBoutiqueAccess } from "@/lib/permissions";
import { streamChat, type AiMessage } from "@/lib/ai/provider";
import { assertAiQuota, incrementAiUsage } from "@/lib/ai/quota";
import { getBoutiqueAiContext, formatAiContext, type BoutiqueAiContext } from "@/server/queries/ai.queries";

export const runtime = "nodejs";

const bodySchema = z.object({
  boutiqueId: z.string().min(1),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }))
    .min(1)
    .max(20),
});

/** Réponse mock data-aware : s'appuie sur les vraies données de la boutique. */
function mockChat(lastUser: string, c: BoutiqueAiContext): string {
  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
  const q = lastUser.toLowerCase();

  if (/stock|rupture|réappro|reappro|manque/.test(q)) {
    if (c.stockFaible.length === 0) return `Bonne nouvelle : aucun produit en stock faible ou en rupture pour ${c.boutiqueNom}. 👍`;
    return `Attention, ${c.stockFaible.length} produit(s) à surveiller :\n` +
      c.stockFaible.map((p) => `• ${p.nom} — ${p.quantite} restant (seuil ${p.seuil})`).join("\n") +
      `\n\nPense à réapprovisionner les plus critiques rapidement.`;
  }
  if (/client/.test(q)) {
    if (c.topClients.length === 0) return `Aucune donnée client pour le moment. Tes ventes enregistrées avec un client apparaîtront ici.`;
    return `Tes meilleurs clients :\n` + c.topClients.map((cl, i) => `${i + 1}. ${cl.nom} — ${fmt(cl.total)}`).join("\n");
  }
  if (/meilleur|top|vend le mieux|populaire|best/.test(q)) {
    if (c.topProduits.length === 0) return `Pas encore de ventes validées pour identifier tes meilleurs produits.`;
    return `Tes produits qui se vendent le mieux :\n` + c.topProduits.map((p, i) => `${i + 1}. ${p.nom} — ${p.qte} vendus`).join("\n");
  }
  if (/combien|chiffre|ca\b|vente|gagn|ce mois/.test(q)) {
    return `Ce mois-ci, ${c.boutiqueNom} a réalisé ${fmt(c.ventesMois)} sur ${c.nbCommandesMois} commande(s). ` +
      (c.topProduits[0] ? `Ton produit phare : ${c.topProduits[0].nom}.` : "");
  }
  // Réponse générale = mini tableau de bord
  return `Voici un aperçu de ${c.boutiqueNom} :\n` +
    `• Ventes du mois : ${fmt(c.ventesMois)} (${c.nbCommandesMois} commandes)\n` +
    `• Catalogue : ${c.totalProduits} produits · ${c.totalClients} clients\n` +
    (c.topProduits[0] ? `• Top vente : ${c.topProduits[0].nom}\n` : "") +
    (c.stockFaible[0] ? `• À réapprovisionner : ${c.stockFaible[0].nom}\n` : "") +
    `\nPose-moi une question précise (ventes, stock, clients, meilleurs produits…).`;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const { boutiqueId, messages } = parsed;

  // Résolution vendeurId (fallback DB comme dans safe-action)
  let vendeurId = session.user.vendeurId as string | undefined;
  if (!vendeurId) {
    const v = await prisma.vendeur.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!v) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    vendeurId = v.id;
  }

  const access = await getBoutiqueAccess(boutiqueId, vendeurId);
  if (!access) return NextResponse.json({ error: "Accès refusé à cette boutique." }, { status: 403 });

  let state;
  try {
    state = await assertAiQuota(session.user.id, vendeurId);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Quota atteint." }, { status: 429 });
  }

  const context = await getBoutiqueAiContext(boutiqueId);
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  const system =
    "Tu es l'Assistant IA Commerce de GestionPro, pour un commerçant en Afrique de l'Ouest (devise FCFA). " +
    "Réponds en français, de façon concise, claire et actionnable, en t'appuyant UNIQUEMENT sur les données réelles ci-dessous. " +
    "Tu ne peux JAMAIS modifier, supprimer ou créer des données : tu informes et conseilles uniquement. " +
    "Si une information manque, dis-le simplement.\n\n=== DONNÉES DE LA BOUTIQUE ===\n" +
    formatAiContext(context);

  const chatMessages: AiMessage[] = messages.slice(-12);
  const source = await streamChat({
    system,
    messages: chatMessages,
    mock: () => mockChat(lastUser, context),
    maxTokens: 800,
  });

  // On capture le texte streamé pour l'historique + on décompte 1 crédit.
  const userId = session.user.id;
  const quota = state.quota;
  let full = "";
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      full += new TextDecoder().decode(chunk);
      controller.enqueue(chunk);
    },
    async flush() {
      try {
        await prisma.aiGeneration.create({
          data: { userId, boutiqueId, type: "CHAT", prompt: lastUser.slice(0, 1000), response: full.slice(0, 4000) },
        });
        await incrementAiUsage(userId, quota);
      } catch (err) {
        console.error("[ai/chat] record failed:", err);
      }
    },
  });

  return new Response(source.pipeThrough(transform), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
