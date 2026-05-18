import { PrismaClient } from "@prisma/client";

// Détection précoce d'env mal configuré pour message d'erreur clair en dev.
if (
  process.env.NODE_ENV !== "production" &&
  (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("user:password"))
) {
  console.warn(
    "\n⚠️  [prisma] DATABASE_URL n'est pas configuré ou utilise les valeurs par défaut.\n" +
      "    Login/register vont échouer. Mettre à jour .env avec la connection string Supabase.\n"
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
