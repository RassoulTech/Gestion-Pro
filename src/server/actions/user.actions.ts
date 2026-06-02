"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
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

export const updateVendeurProfile = authActionClient
  .schema(
    z.object({
      nom: z.string().min(1, "Le nom est requis"),
      prenom: z.string().min(1, "Le prénom est requis"),
      nomAffiche: z.string().optional().or(z.literal("")),
      telephone: z.string().optional().or(z.literal("")),
      pays: z.string().optional().or(z.literal("")),
      ville: z.string().optional().or(z.literal("")),
      adresse: z.string().optional().or(z.literal("")),
      bio: z.string().optional().or(z.literal("")),
      photo: z.string().optional().or(z.literal("")),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    const vendeur = await prisma.vendeur.findUnique({
      where: { userId: user.id },
    });

    if (!vendeur) {
      throw new Error("Profil Vendeur introuvable");
    }

    const updatedVendeur = await prisma.vendeur.update({
      where: { id: vendeur.id },
      data: {
        nom: parsedInput.nom,
        prenom: parsedInput.prenom,
        nomAffiche: parsedInput.nomAffiche || null,
        telephone: parsedInput.telephone || null,
        pays: parsedInput.pays || null,
        ville: parsedInput.ville || null,
        adresse: parsedInput.adresse || null,
        bio: parsedInput.bio || null,
        photo: parsedInput.photo || null,
      },
    });

    const displayName = parsedInput.nomAffiche || `${parsedInput.prenom} ${parsedInput.nom}`;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: displayName,
        image: parsedInput.photo || null,
      },
    });

    return { success: true, vendeur: updatedVendeur };
  });

export const updateVendeurNotifications = authActionClient
  .schema(
    z.object({
      commandes: z.boolean(),
      ventes: z.boolean(),
      clients: z.boolean(),
      paiements: z.boolean(),
      rapports: z.boolean(),
      emails: z.boolean(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const vendeur = await prisma.vendeur.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!vendeur) throw new Error("Profil Vendeur introuvable");

    const updated = await prisma.vendeur.update({
      where: { id: vendeur.id },
      data: {
        notifications: parsedInput,
      },
    });
    return { success: true, notifications: updated.notifications };
  });

export const updateVendeurPreferences = authActionClient
  .schema(
    z.object({
      langue: z.string(),
      timezone: z.string(),
      dateFormat: z.string(),
      currencyFormat: z.string(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const vendeur = await prisma.vendeur.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!vendeur) throw new Error("Profil Vendeur introuvable");

    const updated = await prisma.vendeur.update({
      where: { id: vendeur.id },
      data: {
        preferences: parsedInput,
      },
    });
    return { success: true, preferences: updated.preferences };
  });

export const updateAccountSecurity = authActionClient
  .schema(
    z.object({
      email: z.string().email("Email invalide"),
      oldPassword: z.string().optional().or(z.literal("")),
      newPassword: z.string().optional().or(z.literal("")),
      confirmPassword: z.string().optional().or(z.literal("")),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { email, oldPassword, newPassword, confirmPassword } = parsedInput;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      throw new Error("Compte introuvable");
    }

    const updates: any = {};

    // 1. Handle email update
    if (email !== dbUser.email) {
      const existing = await prisma.user.findUnique({
        where: { email },
      });
      if (existing) {
        throw new Error("Cet email est déjà associé à un autre compte");
      }
      updates.email = email;

      const vendeur = await prisma.vendeur.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (vendeur) {
        await prisma.vendeur.update({
          where: { id: vendeur.id },
          data: { email },
        });
      }
    }

    // 2. Handle password update
    if (newPassword || oldPassword) {
      if (!oldPassword) {
        throw new Error("L'ancien mot de passe est obligatoire pour changer le mot de passe");
      }
      if (!dbUser.password) {
        throw new Error("Aucun mot de passe existant pour ce compte");
      }
      const isMatch = await bcrypt.compare(oldPassword, dbUser.password);
      if (!isMatch) {
        throw new Error("L'ancien mot de passe est incorrect");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("Les nouveaux mots de passe ne correspondent pas");
      }
      if (newPassword && newPassword.length < 8) {
        throw new Error("Le nouveau mot de passe doit faire au moins 8 caractères");
      }
      if (newPassword) {
        updates.password = await bcrypt.hash(newPassword, 12);
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });
    }

    return { success: true };
  });

export const terminateAllOtherSessions = authActionClient
  .action(async ({ ctx }) => {
    const { user } = ctx;
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });
    return { success: true };
  });
