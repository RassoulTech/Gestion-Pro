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
    // Email failures don't block the action — the message is already persisted in DB.
    const [adminMail, autoReplyMail] = await Promise.all([
      sendContactNotificationEmail({ nom, email, sujet, message }),
      sendContactAutoReplyEmail({ nom, email, sujet, message }),
    ]);

    if (!adminMail.sent) {
      console.warn(
        "Le message a été enregistré mais la notification admin n'a pas pu partir."
      );
    }
    if (!autoReplyMail.sent) {
      console.warn(
        "Le message a été enregistré mais l'auto-reply au visiteur n'a pas pu partir."
      );
    }

    return {
      success: "Votre message a été envoyé avec succès ! Nous vous répondrons rapidement.",
    };
  });
