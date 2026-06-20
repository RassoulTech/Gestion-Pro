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

  // Hash base passwords
  const adminHash = await bcrypt.hash("Admin123!", 12);
  const starterHash = await bcrypt.hash("DemoStarter2025!", 12);
  const standardHash = await bcrypt.hash("DemoStandard2025!", 12);
  const premiumHash = await bcrypt.hash("DemoPremium2025!", 12);

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
  const plansMap: Record<string, any> = {};
  for (const def of PLAN_LIST) {
    const plan = await prisma.plan.create({
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
    plansMap[def.code] = plan;
    console.log(`   ✔ Plan created: ${def.nom} (${def.prix} FCFA)`);
  }

  // 3. CREATE DEVELOPER ACCOUNTS
  console.log("🌱 Creating Developer Accounts...");

  const demoAccounts = [
    {
      code: "STARTER",
      name: "Démo Starter",
      email: "demo.starter@mongestionpro.com",
      passHash: starterHash,
      planCode: "STARTER",
      vendeurNom: "Starter",
      vendeurPrenom: "Démo",
      shopName: "Ma Boutique Starter",
      shopSlug: "ma-boutique-starter",
      catName: "Alimentation",
      prodName: "Pain de singe",
      prodCode: "PDS-001",
      prodPrice: 1500,
    },
    {
      code: "STANDARD",
      name: "Démo Standard",
      email: "demo.standard@mongestionpro.com",
      passHash: standardHash,
      planCode: "PRO", // Standard plan corresponds to PRO plan limits
      vendeurNom: "Standard",
      vendeurPrenom: "Démo",
      shopName: "Ma Boutique Standard",
      shopSlug: "ma-boutique-standard",
      catName: "Habillement",
      prodName: "Boubou Traditionnel",
      prodCode: "BT-002",
      prodPrice: 25000,
    },
    {
      code: "PREMIUM",
      name: "Démo Premium",
      email: "demo.premium@mongestionpro.com",
      passHash: premiumHash,
      planCode: "ENTERPRISE", // Premium plan corresponds to ENTERPRISE plan limits
      vendeurNom: "Premium",
      vendeurPrenom: "Démo",
      shopName: "Ma Boutique Premium",
      shopSlug: "ma-boutique-premium",
      catName: "Électronique",
      prodName: "Smartphone Android",
      prodCode: "SA-003",
      prodPrice: 120000,
    },
  ];

  for (const acc of demoAccounts) {
    // A. User
    const user = await prisma.user.create({
      data: {
        name: acc.name,
        email: acc.email,
        password: acc.passHash,
        role: "VENDEUR",
        emailVerified: new Date(),
      },
    });

    // B. Vendeur
    const vendeur = await prisma.vendeur.create({
      data: {
        userId: user.id,
        nom: acc.vendeurNom,
        prenom: acc.vendeurPrenom,
        email: acc.email,
        telephone: "+221 77 000 0000",
        statut: "ACTIF",
      },
    });

    // C. Active Abonnement (1 year duration)
    const plan = plansMap[acc.planCode];
    await prisma.abonnement.create({
      data: {
        vendeurId: vendeur.id,
        planId: plan.id,
        dateDebut: new Date(),
        dateFin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        statut: "ACTIF",
        moyenPaiement: "PayTech",
        montant: plan.prix,
      },
    });

    // D. Boutique
    const boutique = await prisma.boutique.create({
      data: {
        vendeurId: vendeur.id,
        nom: acc.shopName,
        slug: acc.shopSlug,
        description: `Boutique de démonstration pour le forfait ${acc.code}`,
        secteurActivite: "AUTRE",
        statut: "ACTIF",
      },
    });

    // E. Owner membership
    await prisma.membreBoutique.create({
      data: {
        boutiqueId: boutique.id,
        vendeurId: vendeur.id,
        role: "OWNER",
      },
    });

    // F. Category & Product
    const category = await prisma.categorie.create({
      data: {
        boutiqueId: boutique.id,
        nom: acc.catName,
        couleur: "#ea580c",
      },
    });

    await prisma.produit.create({
      data: {
        boutiqueId: boutique.id,
        categorieId: category.id,
        nom: acc.prodName,
        code: acc.prodCode,
        description: `Produit de test pour la boutique ${acc.shopName}`,
        prixAchat: Math.round(acc.prodPrice * 0.7),
        prixUnitaire: acc.prodPrice,
        quantite: 50,
        seuilAlerte: 5,
      },
    });

    console.log(`   ✔ Developer Account Created: ${acc.name} (${acc.email})`);
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
