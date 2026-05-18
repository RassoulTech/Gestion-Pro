import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Instance Edge-safe (sans adapter Prisma ni bcrypt) pour le middleware.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/boutiques/:path*", "/dashboard/:path*", "/admin/:path*"],
};
