import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/schemas/auth.schema";
import type { UserRole } from "@prisma/client";
import { authRatelimit } from "@/lib/ratelimit";
import { headers, cookies } from "next/headers";
import { authConfig } from "@/lib/auth.config";
import { DUMMY_PASSWORD_HASH } from "@/lib/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...authConfig.providers,
    Credentials({
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email;
        const ip = (await headers()).get("x-forwarded-for") ?? "127.0.0.1";

        // Limiter par IP (ex: max 5 requêtes par minute depuis la même IP)
        const ipResult = await authRatelimit.limit(ip);
        if (!ipResult.success) throw new Error("Too many attempts from this IP");

        // Limiter par Email (ex: max 5 tentatives par minute pour le même compte)
        const emailResult = await authRatelimit.limit(email);
        if (!emailResult.success) throw new Error("Too many attempts for this email");

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: { vendeur: { select: { id: true } } },
        });

        if (!user?.password) {
          // Comparaison à vide pour égaliser le temps de réponse, que le compte
          // existe ou non (anti-énumération par timing).
          await bcrypt.compare(parsed.data.password, DUMMY_PASSWORD_HASH);
          return null;
        }

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        // ⚠️ SECURITY : refuser la connexion si l'email n'est pas vérifié.
        if (!user.emailVerified) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          vendeurId: user.vendeur?.id ?? null,
        };
      },
    }),
  ],
  // Override Node-side JWT callback : on enrichit avec un lookup Prisma que
  // l'instance Edge (middleware.ts) ne peut pas faire. Le PrismaAdapter renvoie
  // un User brut au signin OAuth, sans la relation Vendeur — sans ce backfill,
  // les vendeurs créés via Google n'auraient jamais `vendeurId` en session et
  // les actions `vendeurActionClient` retourneraient FORBIDDEN.
  callbacks: {
    ...authConfig.callbacks,
    jwt: async (params) => {
      const baseToken = await authConfig.callbacks!.jwt!(params);
      if (!baseToken) return baseToken;
      if (params.user && (baseToken.vendeurId === undefined || baseToken.vendeurId === null)) {
        const vendeur = await prisma.vendeur.findUnique({
          where: { userId: params.user.id as string },
          select: { id: true },
        });
        if (vendeur) {
          baseToken.vendeurId = vendeur.id;
        }
        // Garantir un role à jour pour les comptes OAuth (PrismaAdapter ne pose
        // que `role` par défaut, et le seed/onboarding peuvent l'avoir modifié).
        const dbUser = await prisma.user.findUnique({
          where: { id: params.user.id as string },
          select: { role: true },
        });
        if (dbUser) {
          baseToken.role = dbUser.role;
          if (params.user) {
            baseToken.originalRole = dbUser.role; // keep track of true role
          }
        }
      }

      // Handle impersonation
      const impersonateUserId = (await cookies()).get("impersonate_user_id")?.value;
      
      if (impersonateUserId && baseToken.originalRole === "ADMIN") {
        const targetUser = await prisma.user.findUnique({
          where: { id: impersonateUserId },
          include: { vendeur: { select: { id: true } } },
        });

        if (targetUser) {
          baseToken.id = targetUser.id;
          baseToken.name = targetUser.name;
          baseToken.email = targetUser.email;
          baseToken.picture = targetUser.image;
          baseToken.role = targetUser.role;
          baseToken.vendeurId = targetUser.vendeur?.id ?? null;
          baseToken.isImpersonating = true;
        }
      } else if (baseToken.isImpersonating) {
        // Stop impersonating (cookie removed)
        const trueUser = await prisma.user.findUnique({
          where: { id: baseToken.originalUserId },
          include: { vendeur: { select: { id: true } } },
        });
        if (trueUser) {
          baseToken.id = trueUser.id;
          baseToken.name = trueUser.name;
          baseToken.email = trueUser.email;
          baseToken.picture = trueUser.image;
          baseToken.role = trueUser.role;
          baseToken.vendeurId = trueUser.vendeur?.id ?? null;
          baseToken.isImpersonating = false;
        }
      }

      return baseToken;
    },
  },
});

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireRole(role: UserRole) {
  const user = await requireAuth();
  if (user.role !== role) {
    throw new Error("FORBIDDEN");
  }
  if (role === "ADMIN" && user.email !== "dionemhd1@gmail.com") {
    throw new Error("FORBIDDEN");
  }
  return user;
}
