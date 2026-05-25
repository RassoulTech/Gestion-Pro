"use server";

import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

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
