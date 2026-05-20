"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { actionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { ratelimit } from "@/lib/ratelimit";
import {
  sendContactNotificationEmail,
  sendContactAutoReplyEmail,
} from "@/lib/mail";

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

    await prisma.contactMessage.create({
      data: { nom, email, sujet, message },
    });

    // Notify the team and send an acknowledgement to the visitor in parallel.
    // Email failures don't lose the message — it's already persisted in DB — but
    // we surface them so the visitor doesn't think a successful email went out
    // when the SMTP credentials are actually broken / revoked / missing.
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
      return {
        success:
          "Votre message est bien enregistré côté serveur, mais notre passerelle email est temporairement indisponible. Nous vous recontacterons dès que possible.",
        emailFailed: true as const,
      };
    }
    if (!adminMail.sent) {
      console.warn("[contact] admin notification failed:", adminMail.error);
    }
    if (!autoReplyMail.sent) {
      console.warn("[contact] visitor auto-reply failed:", autoReplyMail.error);
    }

    return {
      success: "Votre message a été envoyé avec succès ! Nous vous répondrons rapidement.",
      emailFailed: false as const,
    };
  });
