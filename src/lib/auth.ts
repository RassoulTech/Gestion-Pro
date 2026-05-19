import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/schemas/auth.schema";
import type { UserRole } from "@prisma/client";
import { authRatelimit } from "@/lib/ratelimit";
import { headers } from "next/headers";
import { authConfig } from "@/lib/auth.config";

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

        if (!user?.password) return null;

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
  return user;
}
