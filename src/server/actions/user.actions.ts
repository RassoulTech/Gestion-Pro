"use server";

import { z } from "zod";
import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Le nom est trop court").max(100),
  image: z.string().optional().or(z.literal("")),
});

export const updateProfile = authActionClient
  .schema(updateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsedInput.name,
        image: parsedInput.image || null,
      },
    });

    // Update Vendeur info if applicable
    const vendeur = await prisma.vendeur.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (vendeur) {
      await prisma.vendeur.update({
        where: { id: vendeur.id },
        data: {
          nom: parsedInput.name.split(" ")[1] || parsedInput.name,
          prenom: parsedInput.name.split(" ")[0] || "",
          photo: parsedInput.image || null,
        },
      });
    }

    revalidatePath("/profil");
    return { success: true, user: updatedUser };
  });
