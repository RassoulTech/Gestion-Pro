"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { actionClient, adminActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { ratelimit } from "@/lib/ratelimit";
import { logActivity } from "@/lib/activity-log";
import { notifyAdmins } from "@/server/services/notifications";
import { submitSupportSchema } from "@/schemas/support.schema";

/**
 * Point d'entrée UNIQUE de la messagerie support (visiteur + vendeur).
 * Sécurité : zod strict (longueurs), honeypot (succès silencieux → le bot ne
 * sait pas qu'il est détecté), rate-limit par IP, identité vendeur dérivée de
 * la SESSION (jamais des champs du client). Contenu stocké brut, échappé par
 * React à l'affichage (aucun rendu HTML du message).
 */
export const submitSupportMessage = actionClient
  .schema(submitSupportSchema)
  .action(async ({ parsedInput }) => {
    // Honeypot rempli → on répond « succès » sans rien enregistrer.
    if (parsedInput.website) {
      return { success: "Message envoyé, nous vous répondrons rapidement." };
    }

    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
    const { success: allowed } = await ratelimit.limit(`support:${ip}`);
    if (!allowed) {
      throw new Error("Trop de messages envoyés. Merci de patienter quelques minutes.");
    }

    const session = await auth();
    let data: {
      nom: string; email: string; telephone: string | null;
      senderType: string; userId: string | null; vendeurId: string | null; boutiqueId: string | null;
    };

    if (session?.user?.id) {
      // VENDEUR connecté : identité depuis la base (session), pas du formulaire.
      const vendeur = await prisma.vendeur.findUnique({
        where: { userId: session.user.id },
        select: { id: true, nom: true, prenom: true, email: true, telephone: true },
      });
      if (vendeur) {
        // Rattachement boutique : seulement si le vendeur en est bien membre.
        let boutiqueId: string | null = null;
        if (parsedInput.boutiqueId) {
          const membre = await prisma.membreBoutique.findFirst({
            where: { boutiqueId: parsedInput.boutiqueId, vendeurId: vendeur.id },
            select: { boutiqueId: true },
          });
          boutiqueId = membre?.boutiqueId ?? null;
        }
        data = {
          nom: `${vendeur.prenom} ${vendeur.nom}`.trim(),
          email: vendeur.email,
          telephone: vendeur.telephone,
          senderType: "VENDEUR",
          userId: session.user.id,
          vendeurId: vendeur.id,
          boutiqueId,
        };
      } else {
        // Connecté sans profil vendeur (client marketplace) → traité en visiteur
        // avec l'e-mail du compte (fiable).
        data = {
          nom: (parsedInput.nom || session.user.name || "Utilisateur").slice(0, 80),
          email: session.user.email ?? parsedInput.email ?? "",
          telephone: parsedInput.telephone || null,
          senderType: "VISITEUR",
          userId: session.user.id,
          vendeurId: null,
          boutiqueId: null,
        };
      }
    } else {
      // VISITEUR : nom + e-mail obligatoires (pour pouvoir répondre).
      if (!parsedInput.nom?.trim()) throw new Error("Votre nom est requis.");
      if (!parsedInput.email?.trim()) throw new Error("Votre e-mail est requis pour vous répondre.");
      data = {
        nom: parsedInput.nom.trim(),
        email: parsedInput.email.trim(),
        telephone: parsedInput.telephone || null,
        senderType: "VISITEUR",
        userId: null,
        vendeurId: null,
        boutiqueId: null,
      };
    }
    if (!data.email) throw new Error("Votre e-mail est requis pour vous répondre.");

    const created = await prisma.contactMessage.create({
      data: {
        nom: data.nom,
        email: data.email,
        sujet: parsedInput.motif, // compat colonne existante (motif = sujet)
        message: parsedInput.message,
        senderType: data.senderType,
        motif: parsedInput.motif,
        telephone: data.telephone,
        userId: data.userId,
        vendeurId: data.vendeurId,
        boutiqueId: data.boutiqueId,
      },
    });

    await logActivity({
      userId: data.userId ?? undefined,
      action: "SUPPORT_MESSAGE_SENT",
      subjectType: "ContactMessage",
      subjectId: created.id,
      changes: { motif: parsedInput.motif, senderType: data.senderType },
    });
    await notifyAdmins({
      type: "MESSAGE_CONTACT",
      title: data.senderType === "VENDEUR" ? "Message d'un vendeur" : "Message d'un visiteur",
      message: `${data.nom} — ${parsedInput.motif}`,
      link: "/admin/messages",
    }).catch(() => {});

    return { success: "Message envoyé, nous vous répondrons rapidement." };
  });

/** Réponse admin : e-mail au contact + persistance + statut REPONDU. */
export const replySupportMessage = adminActionClient
  .schema(
    z.object({
      messageId: z.string().min(1),
      body: z.string().trim().min(2, "Réponse vide.").max(4000, "Réponse trop longue."),
    })
  )
  .action(async ({ parsedInput: { messageId, body }, ctx }) => {
    const msg = await prisma.contactMessage.findUnique({ where: { id: messageId } });
    if (!msg) throw new Error("Message introuvable.");

    const { sendSupportReplyEmail } = await import("@/lib/mail");
    const mail = await sendSupportReplyEmail({
      to: msg.email,
      nom: msg.nom,
      originalMessage: msg.message,
      replyBody: body,
    });
    if (!mail.sent) {
      throw new Error("L'envoi de l'e-mail a échoué. Réessayez dans un instant.");
    }

    await prisma.$transaction([
      prisma.contactReply.create({ data: { messageId, body } }),
      prisma.contactMessage.update({
        where: { id: messageId },
        data: { statut: "REPONDU", lu: true },
      }),
    ]);

    await logActivity({
      userId: ctx.user.id,
      action: "SUPPORT_MESSAGE_REPLIED",
      subjectType: "ContactMessage",
      subjectId: messageId,
    });

    revalidatePath("/admin/messages");
    return { success: true };
  });

/** Changement de statut (LU / ARCHIVE / NOUVEAU). */
export const setSupportMessageStatut = adminActionClient
  .schema(
    z.object({
      messageId: z.string().min(1),
      statut: z.enum(["NOUVEAU", "LU", "ARCHIVE"]),
    })
  )
  .action(async ({ parsedInput: { messageId, statut } }) => {
    await prisma.contactMessage.update({
      where: { id: messageId },
      data: { statut, lu: statut !== "NOUVEAU" },
    });
    revalidatePath("/admin/messages");
    return { success: true };
  });
