import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PLAN_LIST } from "../src/lib/plan-limits";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Cleaning database...");

  // Clean existing data in order of foreign key constraints
  await prisma.activityLog.deleteMany();
  await prisma.ligneVenteFlash.deleteMany();
  await prisma.venteFlash.deleteMany();
  await prisma.ligneCommandeFournisseur.deleteMany();
  await prisma.commandeFournisseur.deleteMany();
  await prisma.ligneCommandeClient.deleteMany();
  await prisma.commandeClient.deleteMany();
  await prisma.ligneFacture.deleteMany();
  await prisma.facture.deleteMany();
  await prisma.mouvementStock.deleteMany();
  await prisma.depense.deleteMany();
  await prisma.resumeJournalier.deleteMany();
  await prisma.produit.deleteMany();
  await prisma.categorie.deleteMany();
  await prisma.client.deleteMany();
  await prisma.fournisseur.deleteMany();
  await prisma.paiement.deleteMany();
  await prisma.abonnement.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.membreBoutique.deleteMany();
  await prisma.boutique.deleteMany();
  await prisma.vendeur.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.aiGeneration.deleteMany();
  await prisma.aiUsage.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.user.deleteMany();

  console.log("🌱 Database cleaned.");

  // Hash base password
  const adminHash = await bcrypt.hash("Admin123!", 12);

  // 1. CREATE ADMIN
  console.log("🌱 Creating system admin...");
  await prisma.user.create({
    data: {
      name: "Admin GestionPro",
      email: "dionemhd1@gmail.com",
      password: adminHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  // 2. CREATE PLANS
  console.log("🌱 Creating Plans...");
  for (const def of PLAN_LIST) {
    await prisma.plan.create({
      data: {
        nom: def.nom,
        prix: def.prix,
        dureeEssaiJours: def.dureeEssaiJours,
        maxBoutiques: def.maxBoutiques,
        maxProduits: def.maxProduits,
        maxMembres: def.maxMembres,
        codePlan: def.code,
        features: def.features as any,
        actif: true,
      },
    });
    console.log(`   ✔ Plan created: ${def.nom} (${def.prix} FCFA)`);
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
