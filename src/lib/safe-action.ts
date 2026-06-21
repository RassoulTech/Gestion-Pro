import { createSafeActionClient } from "next-safe-action";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Codes d'erreur internes mappés vers des messages utilisateurs.
const KNOWN_ERROR_CODES: Record<string, string> = {
  UNAUTHORIZED: "Vous devez être connecté pour effectuer cette action.",
  FORBIDDEN: "Vous n'avez pas les permissions nécessaires.",
  BOUTIQUE_ACCESS_DENIED: "Accès refusé à cette boutique.",
  OWNER_ONLY: "Seul le propriétaire peut effectuer cette action.",
};

export const actionClient = createSafeActionClient({
  handleServerError: (e) => {
    console.error("Action error:", e.message);

    if (e.message in KNOWN_ERROR_CODES) {
      return KNOWN_ERROR_CODES[e.message];
    }

    // ⚠️ SECURITY : ne JAMAIS exposer les erreurs techniques (Prisma, runtime) —
    // elles peuvent divulguer le schéma de données ou des détails internes.
    const isTechnicalError = /^(PrismaClient|TypeError|ReferenceError|SyntaxError|RangeError)/.test(
      (e as { name?: string }).name ?? ""
    );

    // Les messages métier explicitement levés par les actions (ex. "Trop de
    // tentatives...", "Un compte avec cet email existe déjà.") sont sûrs.
    if (!isTechnicalError && e.message && e.message.length < 200) {
      return e.message;
    }

    return "Une erreur est survenue. Veuillez réessayer.";
  },
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await auth();

  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  return next({
    ctx: {
      user: session.user,
    },
  });
});

/**
 * Vendeur middleware avec fallback DB.
 *
 * Le JWT peut ne pas contenir `vendeurId` dans plusieurs cas :
 * - signin Google OAuth (PrismaAdapter ne joint pas Vendeur)
 * - `update()` côté client échoue silencieusement après onboarding
 * - JWT issued avant la création du profil vendeur
 *
 * Plutôt que de jeter FORBIDDEN aveuglément, on vérifie en DB si un
 * Vendeur existe pour ce user. Ce coût (1 SELECT indexé) ne se paye
 * que lorsque le token est désynchronisé.
 */
export const vendeurActionClient = authActionClient.use(
  async ({ ctx, next }) => {
    let vendeurId = ctx.user.vendeurId;

    if (!vendeurId) {
      const vendeur = await prisma.vendeur.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      if (!vendeur) {
        throw new Error("FORBIDDEN");
      }
      vendeurId = vendeur.id;
    }

    return next({
      ctx: {
        ...ctx,
        vendeurId,
      },
    });
  }
);

/**
 * Admin middleware avec fallback DB sur le rôle.
 *
 * Idem : si le JWT a un rôle obsolète (ex. promotion en ADMIN après
 * signin), on revalide via la DB plutôt que de bloquer à tort.
 */
export const adminActionClient = authActionClient.use(
  async ({ ctx, next }) => {
    let role = ctx.user.role;

    if (ctx.user.email !== "dionemhd1@gmail.com") {
      throw new Error("FORBIDDEN");
    }

    if (role !== "ADMIN") {
      const user = await prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { role: true },
      });
      if (!user || user.role !== "ADMIN") {
        throw new Error("FORBIDDEN");
      }
      role = user.role;
    }

    return next({
      ctx: { ...ctx, user: { ...ctx.user, role } },
    });
  }
);
