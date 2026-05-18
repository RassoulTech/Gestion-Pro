import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing platform database records...");

  // Delete all relational activity logs, lines, and transactions
  await prisma.activityLog.deleteMany();
  await prisma.ligneVenteFlash.deleteMany();
  await prisma.venteFlash.deleteMany();
  await prisma.ligneCommandeFournisseur.deleteMany();
  await prisma.commandeFournisseur.deleteMany();
  await prisma.ligneCommandeClient.deleteMany();
  await prisma.commandeClient.deleteMany();
  await prisma.mouvementStock.deleteMany();
  await prisma.depense.deleteMany();
  await prisma.resumeJournalier.deleteMany();
  await prisma.produit.deleteMany();
  await prisma.categorie.deleteMany();
  await prisma.client.deleteMany();
  await prisma.fournisseur.deleteMany();
  await prisma.paiement.deleteMany();
  await prisma.abonnement.deleteMany();
  
  // Keep the plans, but delete members and boutiques
  await prisma.membreBoutique.deleteMany();
  await prisma.boutique.deleteMany();
  
  // Keep users with role "ADMIN", delete vendors and other users
  await prisma.vendeur.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany({
    where: {
      role: { not: "ADMIN" }
    }
  });

  console.log("✨ Database successfully cleared! All admin pages are now pristine.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
