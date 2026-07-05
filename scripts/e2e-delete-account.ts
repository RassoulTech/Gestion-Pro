/**
 * TEST DE BOUT EN BOUT — suppression définitive d'un compte.
 *
 * 1. Crée un compte de test COMPLET (User + OAuth + Vendeur + Boutique +
 *    catalogue + ventes + achats + factures + stock + abonnement + jetons +
 *    staging) avec des identifiants clairement marqués E2E.
 * 2. Exécute le VRAI code de production (deleteUserCascade) dans une
 *    transaction, comme le font les actions admin/self-service.
 * 3. Vérifie DIRECTEMENT en base qu'il ne reste AUCUNE ligne.
 * 4. Vérifie que la table consultée par l'inscription (users) est vide pour
 *    cet e-mail → la réinscription passerait.
 *
 * Nettoyage garanti : le finally retente la cascade (idempotente).
 */
import { PrismaClient } from "@prisma/client";
import { deleteUserCascade } from "../src/server/services/account-deletion";

const prisma = new PrismaClient();

const EMAIL = "e2e-suppression@test-gestionpro.local";
const SLUG = "e2e-suppression-test-boutique";

async function main() {
  // ── 0) Pré-nettoyage si un run précédent a laissé des restes ──
  await cleanup(true);

  // ── 1) FIXTURE COMPLÈTE ──
  const user = await prisma.user.create({
    data: { email: EMAIL, name: "E2E Test", password: "x", role: "VENDEUR", emailVerified: new Date() },
  });
  await prisma.account.create({
    data: { userId: user.id, type: "oauth", provider: "e2e-test", providerAccountId: "e2e-" + user.id },
  });
  await prisma.notification.create({
    data: { userId: user.id, type: "TEST", title: "e2e", message: "e2e" },
  });
  await prisma.aiGeneration.create({
    data: { userId: user.id, type: "CHAT", prompt: "e2e", response: "e2e" },
  });

  const vendeur = await prisma.vendeur.create({
    data: { userId: user.id, nom: "E2E", prenom: "Test", email: EMAIL },
  });
  const boutique = await prisma.boutique.create({
    data: { vendeurId: vendeur.id, nom: "E2E Boutique", slug: SLUG, secteurActivite: "AUTRE" },
  });
  await prisma.membreBoutique.create({
    data: { boutiqueId: boutique.id, vendeurId: vendeur.id, role: "OWNER" },
  });

  const categorie = await prisma.categorie.create({
    data: { boutiqueId: boutique.id, nom: "E2E Cat" },
  });
  const produit = await prisma.produit.create({
    data: { boutiqueId: boutique.id, categorieId: categorie.id, nom: "E2E Produit", code: "E2E-001", prixUnitaire: 1000, quantite: 10 },
  });
  const client = await prisma.client.create({
    data: { boutiqueId: boutique.id, nom: "E2E Client" },
  });
  const fournisseur = await prisma.fournisseur.create({
    data: { boutiqueId: boutique.id, nom: "E2E Fournisseur" },
  });

  // Vente client (l'en-tête + la ligne qui référence Produit en RESTRICT)
  const commande = await prisma.commandeClient.create({
    data: { boutiqueId: boutique.id, clientId: client.id, code: "E2E-CMD-1", total: 1000 },
  });
  await prisma.ligneCommandeClient.create({
    data: { commandeId: commande.id, produitId: produit.id, quantite: 1, prixUnitaire: 1000 },
  });

  // Achat fournisseur (CommandeFournisseur→Fournisseur est RESTRICT)
  const cmdF = await prisma.commandeFournisseur.create({
    data: { boutiqueId: boutique.id, fournisseurId: fournisseur.id, code: "E2E-CF-1", total: 500 },
  });
  await prisma.ligneCommandeFournisseur.create({
    data: { commandeId: cmdF.id, produitId: produit.id, quantite: 1, prixUnitaire: 500 },
  });

  // Vente flash
  const vf = await prisma.venteFlash.create({
    data: { boutiqueId: boutique.id, code: "E2E-VF-1", total: 1000 },
  });
  await prisma.ligneVenteFlash.create({
    data: { venteFlashId: vf.id, produitId: produit.id, quantite: 1, prixUnitaire: 1000 },
  });

  // Facture
  const facture = await prisma.facture.create({
    data: { boutiqueId: boutique.id, clientId: client.id, numero: "E2E-FAC-1", total: 1000 },
  });
  await prisma.ligneFacture.create({
    data: { factureId: facture.id, produitId: produit.id, designation: "E2E", quantite: 1, prixUnitaire: 1000 },
  });

  // Stock, dépense, résumé
  await prisma.mouvementStock.create({
    data: { boutiqueId: boutique.id, produitId: produit.id, type: "ENTREE", quantite: 10 },
  });
  await prisma.depense.create({
    data: { boutiqueId: boutique.id, libelle: "E2E Dépense", montant: 100 },
  });
  await prisma.resumeJournalier.create({
    data: { boutiqueId: boutique.id, date: new Date("2026-01-01"), ventes: 1000 },
  });

  // Abonnement + paiement (plan existant réutilisé, non touché par la suppression)
  const plan = await prisma.plan.findFirst({ select: { id: true } });
  if (plan) {
    const abo = await prisma.abonnement.create({
      data: { vendeurId: vendeur.id, planId: plan.id, dateDebut: new Date(), montant: 0, statut: "ESSAI" },
    });
    await prisma.paiement.create({
      data: { abonnementId: abo.id, montant: 0, methode: "WAVE" },
    });
  }

  // Jetons + staging e-mail
  await prisma.verificationToken.create({
    data: { identifier: EMAIL, token: "e2e-vt-" + user.id, expires: new Date(Date.now() + 3600e3) },
  });
  await prisma.passwordResetToken.create({
    data: { identifier: EMAIL, token: "e2e-prt-" + user.id, expires: new Date(Date.now() + 3600e3) },
  });
  await prisma.pendingRegistration.create({
    data: {
      email: EMAIL, passwordHash: "x", nom: "E2E", prenom: "Test",
      boutiqueNom: "E2E", secteurActivite: "AUTRE",
      tokenHash: "e2e-th-" + user.id, expires: new Date(Date.now() + 3600e3),
    },
  });

  console.log("FIXTURE OK — compte complet créé (user=" + user.id + ", boutique=" + boutique.id + ")");

  // ── 2) SUPPRESSION via le VRAI code de production ──
  await prisma.$transaction(
    async (tx) =>
      deleteUserCascade(tx, {
        userId: user.id,
        email: EMAIL,
        vendeurId: vendeur.id,
        boutiqueIds: [boutique.id],
      }),
    { timeout: 30000 }
  );
  console.log("SUPPRESSION OK — transaction terminée sans erreur");

  // ── 3) VÉRIFICATION : zéro ligne restante, table par table ──
  const bid = boutique.id;
  const checks: Array<[string, number]> = [
    ["users",                      await prisma.user.count({ where: { email: EMAIL } })],
    ["accounts",                   await prisma.account.count({ where: { userId: user.id } })],
    ["notifications",              await prisma.notification.count({ where: { userId: user.id } })],
    ["ai_generations",             await prisma.aiGeneration.count({ where: { userId: user.id } })],
    ["vendeurs",                   await prisma.vendeur.count({ where: { id: vendeur.id } })],
    ["boutiques",                  await prisma.boutique.count({ where: { id: bid } })],
    ["membres_boutique",           await prisma.membreBoutique.count({ where: { OR: [{ boutiqueId: bid }, { vendeurId: vendeur.id }] } })],
    ["categories",                 await prisma.categorie.count({ where: { boutiqueId: bid } })],
    ["produits",                   await prisma.produit.count({ where: { boutiqueId: bid } })],
    ["clients",                    await prisma.client.count({ where: { boutiqueId: bid } })],
    ["fournisseurs",               await prisma.fournisseur.count({ where: { boutiqueId: bid } })],
    ["commandes_client",           await prisma.commandeClient.count({ where: { boutiqueId: bid } })],
    ["lignes_commande_client",     await prisma.ligneCommandeClient.count({ where: { commandeId: commande.id } })],
    ["commandes_fournisseur",      await prisma.commandeFournisseur.count({ where: { boutiqueId: bid } })],
    ["lignes_commande_fournisseur", await prisma.ligneCommandeFournisseur.count({ where: { commandeId: cmdF.id } })],
    ["ventes_flash",               await prisma.venteFlash.count({ where: { boutiqueId: bid } })],
    ["lignes_vente_flash",         await prisma.ligneVenteFlash.count({ where: { venteFlashId: vf.id } })],
    ["factures",                   await prisma.facture.count({ where: { boutiqueId: bid } })],
    ["lignes_facture",             await prisma.ligneFacture.count({ where: { factureId: facture.id } })],
    ["mouvements_stock",           await prisma.mouvementStock.count({ where: { boutiqueId: bid } })],
    ["depenses",                   await prisma.depense.count({ where: { boutiqueId: bid } })],
    ["resumes_journaliers",        await prisma.resumeJournalier.count({ where: { boutiqueId: bid } })],
    ["abonnements",                await prisma.abonnement.count({ where: { vendeurId: vendeur.id } })],
    ["paiements",                  await prisma.paiement.count({ where: { abonnement: { vendeurId: vendeur.id } } })],
    ["verification_tokens",        await prisma.verificationToken.count({ where: { identifier: EMAIL } })],
    ["password_reset_tokens",      await prisma.passwordResetToken.count({ where: { identifier: EMAIL } })],
    ["pending_registrations",      await prisma.pendingRegistration.count({ where: { email: EMAIL } })],
  ];

  let fail = 0;
  for (const [table, count] of checks) {
    const ok = count === 0;
    if (!ok) fail++;
    console.log((ok ? "  ✓ " : "  ✗ ") + table.padEnd(28) + (ok ? "0 ligne" : count + " LIGNE(S) RESTANTE(S)"));
  }

  // ── 4) La vérification que fait l'inscription (users.email) ──
  const wouldBlock = await prisma.user.findUnique({ where: { email: EMAIL }, select: { emailVerified: true } });
  console.log(wouldBlock ? "  ✗ RÉINSCRIPTION BLOQUÉE (users contient encore l'email)" : "  ✓ RÉINSCRIPTION LIBRE (aucun user pour cet email)");

  if (fail > 0 || wouldBlock) {
    console.log("RESULTAT: ECHEC (" + fail + " table(s) non purgée(s))");
    process.exitCode = 1;
  } else {
    console.log("RESULTAT: SUCCES — suppression réellement complète, e-mail totalement libre");
  }
}

/** Purge best-effort des restes E2E (idempotent). */
async function cleanup(silent = false) {
  const user = await prisma.user.findUnique({
    where: { email: EMAIL },
    select: { id: true, vendeur: { select: { id: true, boutiques: { select: { id: true } } } } },
  });
  const orphanBoutique = await prisma.boutique.findUnique({ where: { slug: SLUG }, select: { id: true, vendeurId: true } });
  if (!user && !orphanBoutique) return;
  if (!silent) console.log("cleanup: restes E2E détectés → purge");
  await prisma.$transaction(
    async (tx) => {
      if (user) {
        await deleteUserCascade(tx, {
          userId: user.id,
          email: EMAIL,
          vendeurId: user.vendeur?.id ?? null,
          boutiqueIds: user.vendeur?.boutiques.map((b) => b.id) ?? [],
        });
      } else if (orphanBoutique) {
        const { deleteBoutiquesData } = await import("../src/server/services/account-deletion");
        await deleteBoutiquesData(tx, [orphanBoutique.id]);
      }
    },
    { timeout: 30000 }
  );
}

main()
  .catch(async (e) => {
    console.error("ERREUR TEST:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
    await cleanup().catch(() => {});
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
