import crypto from "crypto";
import type { Prisma, SecteurActivite } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { logActivity } from "@/lib/activity-log";
import { slugify } from "@/lib/utils";
import { notifyAdmins } from "@/server/services/notifications";

export type VerifyEmailResult =
  | { status: "success"; email: string; boutiqueId?: string }
  | { status: "invalid" }
  | { status: "expired" };

/** Données identité + boutique communes au flux e-mail et au flux OAuth. */
export type VendeurWorkspaceInput = {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  boutiqueNom: string;
  secteurActivite: SecteurActivite;
  boutiqueAdresse?: string | null;
  boutiqueTelephone?: string | null;
  boutiqueEmail?: string | null;
  logo?: string | null;
};

/** Slug unique pour une boutique (base slugifiée + suffixe court si collision). */
export async function buildUniqueSlug(nom: string): Promise<string> {
  const base = slugify(nom) || "boutique";
  const taken = await prisma.boutique.findUnique({ where: { slug: base } });
  return taken ? `${base}-${crypto.randomBytes(3).toString("hex")}` : base;
}

/**
 * Provisionne, DANS une transaction fournie, l'espace vendeur complet pour un
 * `userId` déjà créé : Vendeur → Abonnement Starter → Boutique → Membre OWNER,
 * et passe le rôle à VENDEUR. Renvoie l'id de la boutique créée.
 *
 * Réutilisé par : la vérification e-mail (création atomique du compte) ET la
 * complétion après connexion Google (User déjà existant).
 */
export async function provisionVendeurWorkspace(
  tx: Prisma.TransactionClient,
  userId: string,
  data: VendeurWorkspaceInput,
  slug: string,
  starterPlanId: string | null,
): Promise<{ boutiqueId: string }> {
  const vendeur = await tx.vendeur.create({
    data: {
      userId,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone || null,
    },
  });

  if (starterPlanId) {
    // Starter = ESSAI de 15 jours : le décompte démarre ICI (création du
    // compte + boutique après vérification e-mail), persisté via essaiFin —
    // que le vendeur se connecte ou non ensuite.
    const { TRIAL_DAYS } = await import("@/lib/plan-capabilities");
    const now = new Date();
    await tx.abonnement.create({
      data: {
        vendeurId: vendeur.id,
        planId: starterPlanId,
        statut: "ESSAI",
        dateDebut: now,
        essaiFin: new Date(now.getTime() + TRIAL_DAYS * 24 * 3600 * 1000),
        montant: 0,
      },
    });
  }

  const boutique = await tx.boutique.create({
    data: {
      vendeurId: vendeur.id,
      nom: data.boutiqueNom,
      slug,
      secteurActivite: data.secteurActivite,
      adresse: data.boutiqueAdresse || null,
      telephone: data.boutiqueTelephone || null,
      // Email boutique : la valeur saisie, sinon repli sur l'email du compte.
      email: data.boutiqueEmail || data.email || null,
      logo: data.logo || null,
    },
  });

  await tx.membreBoutique.create({
    data: { boutiqueId: boutique.id, vendeurId: vendeur.id, role: "OWNER" },
  });

  await tx.user.update({ where: { id: userId }, data: { role: "VENDEUR" } });

  return { boutiqueId: boutique.id };
}

/**
 * Crée RÉELLEMENT le compte vendeur à partir d'une inscription en attente, de
 * façon ATOMIQUE : User → Vendeur → Abonnement → Boutique → Membre OWNER, puis
 * suppression de la PendingRegistration. C'est le SEUL endroit où le User et la
 * boutique apparaissent en base — jamais avant la vérification e-mail.
 */
async function createAccountFromPending(pendingId: string): Promise<{
  email: string;
  boutiqueId?: string;
}> {
  const pending = await prisma.pendingRegistration.findUnique({
    where: { id: pendingId },
  });
  if (!pending) return { email: "" };

  // Garde anti-course : si un User existe déjà avec cet email (legacy / client
  // checkout), on n'écrase rien et on ne duplique pas. On retire la pending et
  // on renvoie un succès idempotent (l'utilisateur peut se connecter avec son
  // compte existant).
  const existingUser = await prisma.user.findUnique({
    where: { email: pending.email },
    select: { id: true },
  });
  if (existingUser) {
    await prisma.pendingRegistration
      .delete({ where: { id: pending.id } })
      .catch(() => {});
    return { email: pending.email };
  }

  const slug = await buildUniqueSlug(pending.boutiqueNom);
  const starterPlan = await prisma.plan.findFirst({ where: { nom: "Starter" } });

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: `${pending.prenom} ${pending.nom}`.trim(),
        email: pending.email,
        password: pending.passwordHash, // déjà haché au moment du staging
        emailVerified: new Date(),
        role: "VENDEUR",
      },
    });

    const { boutiqueId } = await provisionVendeurWorkspace(
      tx,
      user.id,
      {
        nom: pending.nom,
        prenom: pending.prenom,
        email: pending.email,
        telephone: pending.telephone,
        boutiqueNom: pending.boutiqueNom,
        secteurActivite: pending.secteurActivite,
        boutiqueAdresse: pending.boutiqueAdresse,
        boutiqueTelephone: pending.boutiqueTelephone,
        boutiqueEmail: pending.boutiqueEmail,
        logo: pending.logo,
      },
      slug,
      starterPlan?.id ?? null,
    );

    // Suppression de la ligne de staging DANS la transaction (atomicité totale).
    await tx.pendingRegistration.delete({ where: { id: pending.id } });

    return { userId: user.id, userName: user.name, boutiqueId };
  });

  // Hors transaction (best-effort) : journal + notification admin — le compte
  // n'apparaît dans l'admin qu'À PARTIR D'ICI.
  await logActivity({
    userId: result.userId,
    action: "ACCOUNT_ACTIVATED",
    changes: { email: pending.email },
  });
  await notifyAdmins({
    type: "NOUVEL_UTILISATEUR",
    title: "Nouvelle inscription",
    message: `${result.userName ?? pending.email} a créé un compte et sa boutique`,
    link: "/admin/utilisateurs",
  }).catch(() => {});

  return { email: pending.email, boutiqueId: result.boutiqueId };
}

/**
 * Valide un token de vérification d'email (usage unique, expirant).
 *
 * 1) NOUVEAU flux vendeur : le token correspond à une `PendingRegistration` →
 *    on crée atomiquement le compte + la boutique.
 * 2) Flux LEGACY : le token correspond à un `verificationToken` d'un User déjà
 *    existant (anciens liens, comptes client) → on marque l'email vérifié.
 *
 * Le token reçu est BRUT ; il est re-haché (SHA-256) avant comparaison.
 */
export async function verifyEmailToken(
  rawToken: string
): Promise<VerifyEmailResult> {
  const tokenHash = hashToken(rawToken);

  await logActivity({
    action: "VERIFICATION_LINK_CLICKED",
    changes: { token: tokenHash },
  });

  // ── 1) Inscription vendeur en attente ────────────────────────────────────
  const pending = await prisma.pendingRegistration.findUnique({
    where: { tokenHash },
  });
  if (pending) {
    if (new Date(pending.expires) < new Date()) {
      return { status: "expired" };
    }
    const created = await createAccountFromPending(pending.id);
    return { status: "success", email: created.email, boutiqueId: created.boutiqueId };
  }

  // ── 2) Flux legacy : User existant à marquer vérifié ─────────────────────
  const existingToken = await prisma.verificationToken.findFirst({
    where: { token: tokenHash },
  });

  if (!existingToken) {
    return { status: "invalid" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    return { status: "expired" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: existingToken.identifier },
  });

  if (!existingUser) {
    return { status: "invalid" };
  }

  await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      emailVerified: new Date(),
      email: existingToken.identifier, // fallback si l'email a changé
    },
  });

  // Anti-rejeu : le token est à usage unique.
  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: existingToken.identifier,
        token: existingToken.token,
      },
    },
  });

  await logActivity({
    userId: existingUser.id,
    action: "ACCOUNT_ACTIVATED",
    changes: { email: existingUser.email },
  });

  return { status: "success", email: existingUser.email };
}
