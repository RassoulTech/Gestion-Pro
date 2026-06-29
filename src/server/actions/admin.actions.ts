"use server";

import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

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

const deleteUserAccountSchema = z.object({ userId: z.string().min(1) });

/**
 * Suppression DÉFINITIVE et ATOMIQUE d'un compte depuis l'admin :
 * User + Vendeur + boutiques possédées + TOUTES les données dépendantes.
 *
 * L'ordre respecte les contraintes FK : les lignes qui référencent `Produit`
 * (et `CommandeFournisseur` qui référence `Fournisseur`) en `Restrict` sont
 * supprimées AVANT leurs parents, sinon la suppression échouerait. Tout se passe
 * dans une seule transaction → soit tout est supprimé, soit rien (aucun orphelin).
 * L'email (unique) redevient libre → la personne se réinscrit de zéro via le flux
 * normal (inscription → vérification e-mail → boutique). Aucune restauration.
 */
export const deleteUserAccount = adminActionClient
  .schema(deleteUserAccountSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = parsedInput;

    // Garde 1 : un admin ne supprime pas son propre compte.
    if (userId === ctx.user.id) {
      throw new Error("Vous ne pouvez pas supprimer votre propre compte administrateur.");
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        vendeur: { select: { id: true, boutiques: { select: { id: true } } } },
      },
    });
    if (!target) throw new Error("Utilisateur introuvable.");

    // Garde 2 : on ne supprime jamais un compte administrateur.
    if (target.role === "ADMIN") {
      throw new Error("Impossible de supprimer un compte administrateur.");
    }

    const vendeurId = target.vendeur?.id ?? null;
    const boutiqueIds = target.vendeur?.boutiques.map((b) => b.id) ?? [];

    await prisma.$transaction(
      async (tx) => {
        if (vendeurId) {
          if (boutiqueIds.length > 0) {
            const inB = { boutiqueId: { in: boutiqueIds } };

            // 1) Lignes référençant Produit en RESTRICT → supprimées en premier.
            await tx.ligneCommandeClient.deleteMany({
              where: { commande: { boutiqueId: { in: boutiqueIds } } },
            });
            await tx.ligneCommandeFournisseur.deleteMany({
              where: { commande: { boutiqueId: { in: boutiqueIds } } },
            });
            await tx.ligneVenteFlash.deleteMany({
              where: { venteFlash: { boutiqueId: { in: boutiqueIds } } },
            });
            await tx.ligneFacture.deleteMany({
              where: { facture: { boutiqueId: { in: boutiqueIds } } },
            });
            await tx.mouvementStock.deleteMany({ where: inB });

            // 2) En-têtes de transactions (leurs lignes sont parties).
            await tx.commandeClient.deleteMany({ where: inB });
            await tx.commandeFournisseur.deleteMany({ where: inB }); // libère Fournisseur (Restrict)
            await tx.venteFlash.deleteMany({ where: inB });
            await tx.facture.deleteMany({ where: inB });

            // 3) Produit (plus aucune réf Restrict) + autres entités de boutique.
            await tx.produit.deleteMany({ where: inB });
            await tx.categorie.deleteMany({ where: inB });
            await tx.client.deleteMany({ where: inB });
            await tx.fournisseur.deleteMany({ where: inB });
            await tx.depense.deleteMany({ where: inB });
            await tx.resumeJournalier.deleteMany({ where: inB });
            await tx.membreBoutique.deleteMany({ where: inB }); // membres (staff) de ces boutiques

            // 4) Boutiques.
            await tx.boutique.deleteMany({ where: { id: { in: boutiqueIds } } });
          }

          // 5) Niveau vendeur.
          await tx.paiement.deleteMany({ where: { abonnement: { vendeurId } } });
          await tx.abonnement.deleteMany({ where: { vendeurId } });
          await tx.membreBoutique.deleteMany({ where: { vendeurId } }); // appartenances ailleurs
          await tx.vendeur.delete({ where: { id: vendeurId } });
        }

        // 6) Jetons / staging liés à l'email → libère l'email pour la réinscription.
        await tx.verificationToken.deleteMany({ where: { identifier: target.email } });
        await tx.passwordResetToken.deleteMany({ where: { identifier: target.email } });
        await tx.pendingRegistration.deleteMany({ where: { email: target.email } });

        // 7) User : cascade Account/Session/Notification/AiGeneration/AiUsage ;
        //    ActivityLog.userId → SetNull (l'audit est conservé, anonymisé).
        await tx.user.delete({ where: { id: userId } });
      },
      { timeout: 30000 }
    );

    // 8) Traçabilité (acteur = admin courant ; aucune donnée sensible exposée).
    await logActivity({
      userId: ctx.user.id,
      action: "admin.deleteUserAccount",
      subjectType: "User",
      subjectId: userId,
      changes: {
        email: target.email,
        nom: target.name,
        vendeurSupprime: Boolean(vendeurId),
        boutiquesSupprimees: boutiqueIds.length,
      },
    });

    revalidatePath("/admin/vendeurs");
    revalidatePath("/admin/utilisateurs");
    revalidatePath("/admin/boutiques");
    revalidatePath("/admin/dashboard");
    return { success: true, email: target.email };
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
