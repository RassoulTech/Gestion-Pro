"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { actionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { ratelimit } from "@/lib/ratelimit";
import { logActivity } from "@/lib/activity-log";
import {
  sendContactNotificationEmail,
  sendContactAutoReplyEmail,
} from "@/lib/mail";
import { notifyAdmins } from "@/server/services/notifications";

const contactSchema = z.object({
  nom: z.string().min(2, "Le nom est trop court"),
  email: z.string().email("Email invalide"),
  sujet: z.string().min(5, "Le sujet est trop court"),
  message: z.string().min(10, "Le message est trop court"),
});

export const sendContactMessage = actionClient
  .schema(contactSchema)
  .action(async ({ parsedInput }) => {
    const ip = (await headers()).get("x-forwarded-for") ?? "127.0.0.1";
    const { success } = await ratelimit.limit(`contact:${ip}`);

    if (!success) {
      throw new Error(
        "Trop de messages envoyés. Merci de patienter quelques minutes."
      );
    }

    const { nom, email, sujet, message } = parsedInput;

    await logActivity({
      action: "CONTACT_MESSAGE_SENT",
      changes: { email, nom, sujet },
    });

    await prisma.contactMessage.create({
      data: { nom, email, sujet, message },
    });

    // Envoyer une notification interne aux admins
    await notifyAdmins({
      type: "MESSAGE_CONTACT",
      title: "Nouveau message de contact",
      message: `${nom} : ${sujet}`,
      link: "/admin/dashboard",
    });

    const [adminMail, autoReplyMail] = await Promise.all([
      sendContactNotificationEmail({ nom, email, sujet, message }),
      sendContactAutoReplyEmail({ nom, email, sujet, message }),
    ]);

    const emailFailed = !adminMail.sent && !autoReplyMail.sent;
    if (emailFailed) {
      console.error(
        "[contact] both emails failed — admin:",
        adminMail.error,
        "| autoReply:",
        autoReplyMail.error
      );
      await logActivity({
        action: "CONTACT_ADMIN_EMAIL_FAILED",
        changes: { email, error: adminMail.error },
      });
      await logActivity({
        action: "CONTACT_AUTOREPLY_EMAIL_FAILED",
        changes: { email, error: autoReplyMail.error },
      });
      throw new Error("L'envoi des e-mails a échoué. Notre service de messagerie est temporairement indisponible.");
    }

    if (!adminMail.sent) {
      console.warn("[contact] admin notification failed:", adminMail.error);
      await logActivity({
        action: "CONTACT_ADMIN_EMAIL_FAILED",
        changes: { email, error: adminMail.error },
      });
    }
    if (!autoReplyMail.sent) {
      console.warn("[contact] visitor auto-reply failed:", autoReplyMail.error);
      await logActivity({
        action: "CONTACT_AUTOREPLY_EMAIL_FAILED",
        changes: { email, error: autoReplyMail.error },
      });
    }

    return {
      success: "Votre message a été envoyé avec succès ! Nous vous répondrons rapidement.",
      emailFailed: false as const,
    };
  });
