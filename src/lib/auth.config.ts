import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
      role: UserRole;
      vendeurId: string | null;
      isImpersonating?: boolean;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    vendeurId: string | null;
    originalUserId?: string;
    originalRole?: UserRole;
    isImpersonating?: boolean;
  }
}

/**
 * Configuration Auth.js partagée et compatible Edge runtime.
 * - Ne contient PAS l'adapter Prisma (incompatible Edge).
 * - Ne contient PAS le provider Credentials (bcrypt incompatible Edge).
 * - Utilisée par le middleware ET enrichie côté Node par lib/auth.ts.
 *
 * Note : on déclare TOUJOURS le provider Google même si les credentials
 * sont absents au build. La détection conditionnelle (`googleEnabled`)
 * peut faire dead-code-eliminer le provider quand Vercel évalue le bundle
 * Edge → erreur "Configuration" trompeuse. Si les credentials manquent
 * vraiment au runtime, NextAuth jettera une erreur explicite au signin.
 */
/**
 * Empêche qu'une image (avatar) gonfle le JWT de session.
 *
 * 🔴 CAUSE de MIDDLEWARE_INVOCATION_FAILED (500 sur /boutiques) : une data URL
 * base64 (avatar/logo uploadé) peut peser > 30 Ko. Stockée dans `token.picture`,
 * elle fait dépasser au cookie de session la **limite de 32 Ko des en-têtes de
 * réponse** du middleware Edge Vercel → à chaque rafraîchissement du cookie par le
 * middleware, Vercel REJETTE la réponse (erreur réelle vue dans les logs :
 * « These response headers exceed the maximum size of 32KB: set-cookie ... 33108 bytes »).
 *
 * On ne conserve donc dans le token QUE des URLs http(s) courtes ; jamais de data
 * URL. L'image réelle reste en base (User.image / Vendeur.photo / Boutique.logo) et
 * est rechargée à l'affichage si besoin.
 */
function safeJwtImage(image: unknown): string | null {
  if (typeof image !== "string" || image.length === 0) return null;
  if (image.startsWith("data:")) return null; // base64 → exclu du cookie
  if (image.length > 1024) return null; // garde-fou de taille (URL anormalement longue)
  return image;
}

export const authConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    // ⚠️ SECURITY : n'accepter une connexion Google que si l'email est RÉELLEMENT
    // vérifié par Google. Sans ce garde-fou, allowDangerousEmailAccountLinking
    // permettrait de relier une identité OAuth à un compte existant (créé
    // manuellement) sans preuve d'email vérifiée → contournement de vérification
    // / prise de contrôle de compte. Les autres providers passent inchangés.
    signIn: async ({ account, profile }) => {
      if (account?.provider === "google") {
        const emailVerified = (profile as { email_verified?: boolean } | undefined)
          ?.email_verified;
        if (emailVerified !== true) return false;
      }
      return true;
    },
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.id = user.id!;
        token.name = user.name;
        token.picture = safeJwtImage(user.image);
        token.role = (user as { role: UserRole }).role;
        token.vendeurId = (user as { vendeurId: string | null }).vendeurId;
        token.originalUserId = user.id!;
        token.originalRole = (user as { role: UserRole }).role;
      }

      if (trigger === "update" && session) {
        if (session.user?.name !== undefined) token.name = session.user.name;
        if (session.user?.image !== undefined) token.picture = safeJwtImage(session.user.image);
        token.role = session.role ?? token.role;
        token.vendeurId = session.vendeurId ?? token.vendeurId;
      }

      // Auto-réparation : toute session DÉJÀ gonflée (data URL stockée avant ce
      // correctif) voit son image purgée au prochain passage → le cookie repasse
      // sous 32 Ko et le middleware cesse de planter. S'exécute à chaque requête.
      token.picture = safeJwtImage(token.picture);

      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.id;
      session.user.name = token.name as string | null;
      session.user.image = (token.picture as string | null) ?? null;
      session.user.role = token.role;
      session.user.vendeurId = token.vendeurId;
      session.user.isImpersonating = token.isImpersonating;
      return session;
    },
    authorized: ({ auth: session, request: { nextUrl } }) => {
      const isLoggedIn = !!session?.user;
      const userRole = session?.user?.role;
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnBoutiques = nextUrl.pathname.startsWith("/boutiques") || nextUrl.pathname.startsWith("/dashboard");

      if (isOnAdmin) {
        if (!isLoggedIn) return false;
        return userRole === "ADMIN" && session?.user?.email === "dionemhd1@gmail.com";
      }

      if (isOnBoutiques) {
        if (!isLoggedIn) return false;
        return true;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
