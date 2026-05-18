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
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    vendeurId: string | null;
  }
}

const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

/**
 * Configuration Auth.js partagée et compatible Edge runtime.
 * - Ne contient PAS l'adapter Prisma (incompatible Edge).
 * - Ne contient PAS le provider Credentials (bcrypt incompatible Edge).
 * - Utilisée par le middleware ET enrichie côté Node par lib/auth.ts.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.id = user.id!;
        token.name = user.name;
        token.picture = user.image;
        token.role = (user as { role: UserRole }).role;
        token.vendeurId = (user as { vendeurId: string | null }).vendeurId;
      }

      if (trigger === "update" && session) {
        if (session.user?.name !== undefined) token.name = session.user.name;
        if (session.user?.image !== undefined) token.picture = session.user.image;
        token.role = session.role ?? token.role;
        token.vendeurId = session.vendeurId ?? token.vendeurId;
      }

      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.id;
      session.user.name = token.name as string | null;
      session.user.image = (token.picture as string | null) ?? null;
      session.user.role = token.role;
      session.user.vendeurId = token.vendeurId;
      return session;
    },
    authorized: ({ auth: session, request: { nextUrl } }) => {
      const isLoggedIn = !!session?.user;
      const userRole = session?.user?.role;
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnBoutiques = nextUrl.pathname.startsWith("/boutiques") || nextUrl.pathname.startsWith("/dashboard");

      if (isOnAdmin) {
        if (!isLoggedIn) return false;
        return userRole === "ADMIN";
      }

      if (isOnBoutiques) {
        if (!isLoggedIn) return false;
        return true;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
