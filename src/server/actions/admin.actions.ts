"use server";

import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";

const toggleVendeurSchema = z.object({
  vendeurId: z.string(),
});

export const toggleVendeurStatut = adminActionClient
  .schema(toggleVendeurSchema)
  .action(async ({ parsedInput }) => {
    const { vendeurId } = parsedInput;

    const vendeur = await prisma.vendeur.findUnique({
      where: { id: vendeurId },
      select: { statut: true },
    });

    if (!vendeur) {
      throw new Error("Vendeur non trouvé.");
    }

    const newStatut = vendeur.statut === "ACTIF" ? "SUSPENDU" : "ACTIF";

    await prisma.vendeur.update({
      where: { id: vendeurId },
      data: { statut: newStatut },
    });

    revalidatePath("/admin/vendeurs");
    revalidatePath("/admin/dashboard");
    return { success: true, newStatut };
  });

const toggleBoutiqueSchema = z.object({
  boutiqueId: z.string(),
});

export const toggleBoutiqueStatut = adminActionClient
  .schema(toggleBoutiqueSchema)
  .action(async ({ parsedInput }) => {
    const { boutiqueId } = parsedInput;

    const boutique = await prisma.boutique.findUnique({
      where: { id: boutiqueId },
      select: { statut: true },
    });

    if (!boutique) {
      throw new Error("Boutique non trouvée.");
    }

    const newStatut = boutique.statut === "ACTIF" ? "SUSPENDU" : "ACTIF";

    await prisma.boutique.update({
      where: { id: boutiqueId },
      data: { statut: newStatut },
    });

    revalidatePath("/admin/boutiques");
    revalidatePath("/admin/dashboard");
    return { success: true, newStatut };
  });

export async function impersonateVendeur(userId: string) {
  try {
    // Seul un ADMIN peut utiliser cette action
    await requireRole("ADMIN");

    // Définir un cookie sécurisé pour forcer l'impersonation (expire dans 1 heure max)
    (await cookies()).set("impersonate_user_id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 heure
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Impersonation error:", error);
    return { success: false, error: error.message };
  }
}

export async function stopImpersonating() {
  try {
    (await cookies()).delete("impersonate_user_id");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Stop impersonating error:", error);
    return { success: false, error: error.message };
  }
}
