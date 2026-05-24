import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Suppression des abonnements et paiements de test...");
  
  const result = await prisma.abonnement.deleteMany({
    where: {
      moyenPaiement: "Wave" // The test subscription uses Wave
    }
  });

  const result2 = await prisma.abonnement.deleteMany({
    where: {
      statut: "ESSAI",
      montant: 0
    }
  });

  console.log(`Supprimé: ${result.count + result2.count} abonnements.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
