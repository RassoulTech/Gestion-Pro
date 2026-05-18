"use server";

import { z } from "zod";
import { actionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";

const contactSchema = z.object({
  nom: z.string().min(2, "Le nom est trop court"),
  email: z.string().email("Email invalide"),
  sujet: z.string().min(5, "Le sujet est trop court"),
  message: z.string().min(10, "Le message est trop court"),
});

export const sendContactMessage = actionClient
  .schema(contactSchema)
  .action(async ({ parsedInput }) => {
    const { nom, email, sujet, message } = parsedInput;

    await prisma.contactMessage.create({
      data: {
        nom,
        email,
        sujet,
        message,
      },
    });

    return { success: "Votre message a été envoyé avec succès !" };
  });
