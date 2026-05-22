import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Updating subscription dates to 2027...");
  const now = new Date();
  const future = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
  
  await prisma.abonnement.updateMany({
    data: {
      dateFin: future,
      essaiFin: future,
      statut: "ACTIF",
    },
  });
  console.log("Done!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
