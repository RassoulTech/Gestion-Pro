import { createSafeActionClient } from "next-safe-action";
import { auth } from "@/lib/auth";

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

    // Les messages explicitement levés par les actions (ex. "Trop de tentatives...",
    // "Un compte avec cet email existe déjà.") sont sûrs à exposer tels quels.
    if (e.message && e.message.length < 200) {
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

export const vendeurActionClient = authActionClient.use(
  async ({ ctx, next }) => {
    if (!ctx.user.vendeurId) {
      throw new Error("FORBIDDEN");
    }

    return next({
      ctx: {
        ...ctx,
        vendeurId: ctx.user.vendeurId,
      },
    });
  }
);

export const adminActionClient = authActionClient.use(
  async ({ ctx, next }) => {
    if (ctx.user.role !== "ADMIN") {
      throw new Error("FORBIDDEN");
    }

    return next({
      ctx,
    });
  }
);
