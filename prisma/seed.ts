import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");
  

  // Clean existing data
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
  await prisma.plan.deleteMany();
  await prisma.membreBoutique.deleteMany();
  await prisma.boutique.deleteMany();
  await prisma.vendeur.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash("Admin123!", 12);

  // ─── ADMIN ──────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      name: "Admin GestionPro",
      email: "admin@gestionpro.com",
      password: hash,
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    },
  });

  // ─── PLANS ──────────────────────────────────
  const [planGratuit, planPro, planEntreprise] = await Promise.all([
    prisma.plan.create({
      data: {
        nom: "Starter",
        prix: 0,
        dureeEssaiJours: 90,
        maxBoutiques: 1,
        maxProduits: 50,
        features: [
          "1 boutique maximum",
          "50 produits maximum",
          "POS simple",
          "Stock basique",
          "Support email"
        ],
      },
    }),
    prisma.plan.create({
      data: {
        nom: "Pro",
        prix: 9900,
        dureeEssaiJours: 90,
        maxBoutiques: 3,
        maxProduits: 500,
        features: [
          "Maximum 3 boutiques",
          "Jusqu'à 500 produits",
          "POS avancé",
          "Ventes flash",
          "Stock avancé",
          "Rapports détaillés",
          "Marketplace public",
          "Export PDF/Excel",
          "Support prioritaire"
        ],
      },
    }),
    prisma.plan.create({
      data: {
        nom: "Enterprise",
        prix: 19000,
        dureeEssaiJours: 30,
        maxBoutiques: 999999, // illimitées
        maxProduits: 999999, // illimités
        features: [
          "Boutiques illimitées",
          "Produits illimités",
          "Rôles & permissions avancés",
          "Multi-utilisateurs",
          "API & intégrations",
          "Analytics avancés",
          "Rapports premium",
          "SLA & onboarding dédié",
          "Support 24/7",
          "Gestion multi-équipes",
          "Accès admin avancé",
          "Automatisations avancées"
        ],
      },
    }),
  ]);

  // ─── VENDEUR 1 ──────────────────────────────
  const userV1 = await prisma.user.create({
    data: {
      name: "Amadou Diallo",
      email: "amadou@example.com",
      password: hash,
      role: "VENDEUR",
      emailVerifiedAt: new Date(),
    },
  });

  const vendeur1 = await prisma.vendeur.create({
    data: {
      userId: userV1.id,
      nom: "Diallo",
      prenom: "Amadou",
      email: "amadou@example.com",
      telephone: "+221 77 123 4567",
      statut: "ACTIF",
    },
  });

  // Boutique 1
  const boutique1 = await prisma.boutique.create({
    data: {
      vendeurId: vendeur1.id,
      nom: "Diallo Électronique",
      slug: "diallo-electronique",
      description: "Vente de matériel informatique et électronique à Dakar",
      adresse: "123 Avenue Cheikh Anta Diop, Dakar",
      email: "contact@diallo-electronique.com",
      telephone: "+221 33 820 1234",
      secteurActivite: "ELECTRONIQUE",
      statut: "ACTIF",
    },
  });

  await prisma.membreBoutique.create({
    data: { boutiqueId: boutique1.id, vendeurId: vendeur1.id, role: "OWNER" },
  });

  // Categories for boutique 1
  const [catOrdi, catTel, catAccess] = await Promise.all([
    prisma.categorie.create({ data: { boutiqueId: boutique1.id, nom: "Ordinateurs", couleur: "#3b82f6" } }),
    prisma.categorie.create({ data: { boutiqueId: boutique1.id, nom: "Téléphones", couleur: "#10b981" } }),
    prisma.categorie.create({ data: { boutiqueId: boutique1.id, nom: "Accessoires", couleur: "#f59e0b" } }),
  ]);

  // Products
  const produits1 = await Promise.all([
    prisma.produit.create({ data: { boutiqueId: boutique1.id, categorieId: catOrdi.id, nom: "Laptop HP ProBook 450", code: "HP-PB450", prixAchat: 350000, prixUnitaire: 450000, quantite: 15, seuilAlerte: 3 } }),
    prisma.produit.create({ data: { boutiqueId: boutique1.id, categorieId: catOrdi.id, nom: "Laptop Lenovo ThinkPad", code: "LEN-TP14", prixAchat: 400000, prixUnitaire: 520000, quantite: 8, seuilAlerte: 2 } }),
    prisma.produit.create({ data: { boutiqueId: boutique1.id, categorieId: catTel.id, nom: "Samsung Galaxy A54", code: "SAM-A54", prixAchat: 150000, prixUnitaire: 195000, quantite: 25, seuilAlerte: 5 } }),
    prisma.produit.create({ data: { boutiqueId: boutique1.id, categorieId: catTel.id, nom: "iPhone 15", code: "APL-IP15", prixAchat: 550000, prixUnitaire: 650000, quantite: 5, seuilAlerte: 2 } }),
    prisma.produit.create({ data: { boutiqueId: boutique1.id, categorieId: catAccess.id, nom: "Souris Logitech MX Master", code: "LOG-MXM3", prixAchat: 25000, prixUnitaire: 35000, quantite: 40, seuilAlerte: 10 } }),
    prisma.produit.create({ data: { boutiqueId: boutique1.id, categorieId: catAccess.id, nom: "Clavier Mécanique Keychron", code: "KEY-K2V2", prixAchat: 35000, prixUnitaire: 48000, quantite: 2, seuilAlerte: 5 } }),
    prisma.produit.create({ data: { boutiqueId: boutique1.id, categorieId: catAccess.id, nom: "Écouteurs AirPods Pro", code: "APL-APP2", prixAchat: 120000, prixUnitaire: 155000, quantite: 12, seuilAlerte: 3 } }),
  ]);

  // Clients
  const clients1 = await Promise.all([
    prisma.client.create({ data: { boutiqueId: boutique1.id, nom: "Ndiaye", prenom: "Fatou", telephone: "+221 76 543 2100", email: "fatou.ndiaye@email.com" } }),
    prisma.client.create({ data: { boutiqueId: boutique1.id, nom: "Sow", prenom: "Ibrahima", telephone: "+221 77 888 9999" } }),
    prisma.client.create({ data: { boutiqueId: boutique1.id, nom: "Ba", prenom: "Mariama", telephone: "+221 78 111 2222", email: "mariama.ba@email.com" } }),
    prisma.client.create({ data: { boutiqueId: boutique1.id, nom: "Fall", prenom: "Ousmane", telephone: "+221 76 333 4444" } }),
    prisma.client.create({ data: { boutiqueId: boutique1.id, nom: "Diop", prenom: "Aïssatou", telephone: "+221 77 555 6666" } }),
  ]);

  // Fournisseurs
  await Promise.all([
    prisma.fournisseur.create({ data: { boutiqueId: boutique1.id, nom: "TechDistrib Sénégal", telephone: "+221 33 850 0000", email: "contact@techdistrib.sn" } }),
    prisma.fournisseur.create({ data: { boutiqueId: boutique1.id, nom: "Import Électro SARL", telephone: "+221 33 860 0000" } }),
    prisma.fournisseur.create({ data: { boutiqueId: boutique1.id, nom: "Accessoires Plus", telephone: "+221 33 870 0000", email: "info@accplus.sn" } }),
  ]);

  // Commandes
  const cmd1 = await prisma.commandeClient.create({
    data: {
      boutiqueId: boutique1.id,
      clientId: clients1[0]!.id,
      userId: userV1.id,
      code: "CMD-001",
      total: 645000,
      etat: "LIVREE",
      date: new Date("2025-05-10"),
    },
  });
  await prisma.ligneCommandeClient.createMany({
    data: [
      { commandeId: cmd1.id, produitId: produits1[0]!.id, quantite: 1, prixUnitaire: 450000 },
      { commandeId: cmd1.id, produitId: produits1[2]!.id, quantite: 1, prixUnitaire: 195000 },
    ],
  });

  const cmd2 = await prisma.commandeClient.create({
    data: {
      boutiqueId: boutique1.id,
      clientId: clients1[1]!.id,
      userId: userV1.id,
      code: "CMD-002",
      total: 650000,
      etat: "VALIDEE",
      date: new Date("2025-05-12"),
    },
  });
  await prisma.ligneCommandeClient.create({
    data: { commandeId: cmd2.id, produitId: produits1[3]!.id, quantite: 1, prixUnitaire: 650000 },
  });

  // Vente flash
  const vf1 = await prisma.venteFlash.create({
    data: { boutiqueId: boutique1.id, code: "VF-001", nomClient: "Client passage", total: 83000, date: new Date("2025-05-13") },
  });
  await prisma.ligneVenteFlash.createMany({
    data: [
      { venteFlashId: vf1.id, produitId: produits1[4]!.id, quantite: 1, prixUnitaire: 35000 },
      { venteFlashId: vf1.id, produitId: produits1[5]!.id, quantite: 1, prixUnitaire: 48000 },
    ],
  });

  // Depenses
  await Promise.all([
    prisma.depense.create({ data: { boutiqueId: boutique1.id, libelle: "Loyer mensuel", montant: 150000, categorie: "Loyer", date: new Date("2025-05-01") } }),
    prisma.depense.create({ data: { boutiqueId: boutique1.id, libelle: "Électricité", montant: 25000, categorie: "Charges", date: new Date("2025-05-05") } }),
    prisma.depense.create({ data: { boutiqueId: boutique1.id, libelle: "Internet fibre", montant: 30000, categorie: "Charges", date: new Date("2025-05-01") } }),
  ]);

  // ─── VENDEUR 2 ──────────────────────────────
  const userV2 = await prisma.user.create({
    data: {
      name: "Awa Traoré",
      email: "awa@example.com",
      password: hash,
      role: "VENDEUR",
      emailVerifiedAt: new Date(),
    },
  });

  const vendeur2 = await prisma.vendeur.create({
    data: {
      userId: userV2.id,
      nom: "Traoré",
      prenom: "Awa",
      email: "awa@example.com",
      telephone: "+221 78 987 6543",
      statut: "ACTIF",
    },
  });

  const boutique2 = await prisma.boutique.create({
    data: {
      vendeurId: vendeur2.id,
      nom: "Beauté d'Afrique",
      slug: "beaute-d-afrique",
      description: "Produits de beauté naturels et cosmétiques africains",
      adresse: "45 Rue Moussé Diop, Dakar Plateau",
      secteurActivite: "BEAUTE",
      statut: "ACTIF",
    },
  });

  await prisma.membreBoutique.create({
    data: { boutiqueId: boutique2.id, vendeurId: vendeur2.id, role: "OWNER" },
  });

  const [catSoins, catMaquillage] = await Promise.all([
    prisma.categorie.create({ data: { boutiqueId: boutique2.id, nom: "Soins naturels", couleur: "#10b981" } }),
    prisma.categorie.create({ data: { boutiqueId: boutique2.id, nom: "Maquillage", couleur: "#ec4899" } }),
  ]);

  await Promise.all([
    prisma.produit.create({ data: { boutiqueId: boutique2.id, categorieId: catSoins.id, nom: "Beurre de karité pur", code: "BK-001", prixAchat: 3000, prixUnitaire: 5500, quantite: 100, seuilAlerte: 20 } }),
    prisma.produit.create({ data: { boutiqueId: boutique2.id, categorieId: catSoins.id, nom: "Huile de baobab", code: "HB-001", prixAchat: 4500, prixUnitaire: 7500, quantite: 60, seuilAlerte: 15 } }),
    prisma.produit.create({ data: { boutiqueId: boutique2.id, categorieId: catMaquillage.id, nom: "Fond de teint Nubian", code: "FT-NUB", prixAchat: 8000, prixUnitaire: 12000, quantite: 30, seuilAlerte: 5 } }),
    prisma.produit.create({ data: { boutiqueId: boutique2.id, categorieId: catMaquillage.id, nom: "Rouge à lèvres mat", code: "RL-MAT", prixAchat: 3500, prixUnitaire: 5000, quantite: 45, seuilAlerte: 10 } }),
  ]);

  await Promise.all([
    prisma.client.create({ data: { boutiqueId: boutique2.id, nom: "Camara", prenom: "Khady", telephone: "+221 76 111 0000" } }),
    prisma.client.create({ data: { boutiqueId: boutique2.id, nom: "Dieng", prenom: "Rama", telephone: "+221 77 222 0000" } }),
  ]);

  // ─── ABONNEMENTS ────────────────────────────
  await prisma.abonnement.create({
    data: {
      vendeurId: vendeur1.id,
      planId: planPro.id,
      dateDebut: new Date("2025-04-01"),
      dateFin: new Date("2025-07-01"),
      statut: "ACTIF",
      montant: 9900,
      moyenPaiement: "Wave",
    },
  });

  await prisma.abonnement.create({
    data: {
      vendeurId: vendeur2.id,
      planId: planGratuit.id,
      dateDebut: new Date("2025-05-01"),
      essaiFin: new Date("2025-05-15"),
      statut: "ESSAI",
      montant: 0,
    },
  });

  console.log("✅ Seed completed!");
  console.log("   Admin: admin@gestionpro.com / Admin123!");
  console.log("   Vendeur 1: amadou@example.com / Admin123!");
  console.log("   Vendeur 2: awa@example.com / Admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
