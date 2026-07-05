import type { Prisma } from "@prisma/client";

/**
 * Suppression en cascade — SOURCE UNIQUE partagée par les 3 chemins de
 * suppression (admin `deleteUserAccount`, self-service `deleteVendorAccount`,
 * self-service `deleteBoutiquePermanently`).
 *
 * POURQUOI un ordre explicite : un `boutique.delete` / `user.delete` "nu" qui
 * compte sur les cascades Prisma ÉCHOUE (P2003) dès que la boutique a un
 * historique de ventes, car quatre tables référencent `Produit` en RESTRICT
 * (LigneCommandeClient, LigneCommandeFournisseur, LigneVenteFlash,
 * MouvementStock) et `CommandeFournisseur` référence `Fournisseur` en RESTRICT.
 * Postgres ne garantit pas que la cascade supprime les lignes avant les
 * produits → l'opération entière est rejetée et le compte "supprimé" reste en
 * base (symptôme : « le compte existe déjà » à la réinscription).
 *
 * Toujours appeler ces helpers DANS `prisma.$transaction` (atomique : tout ou
 * rien) et journaliser APRÈS le succès de la transaction, jamais avant.
 */
type Tx = Prisma.TransactionClient;

/**
 * Purge complète des données d'une ou plusieurs boutiques (lignes → en-têtes →
 * catalogue/tiers → boutique). Idempotent si les ids n'existent plus.
 */
export async function deleteBoutiquesData(tx: Tx, boutiqueIds: string[]) {
  if (boutiqueIds.length === 0) return;
  const inB = { boutiqueId: { in: boutiqueIds } };

  // 1) Lignes référençant Produit en RESTRICT → supprimées en premier.
  await tx.ligneCommandeClient.deleteMany({
    where: { commande: { boutiqueId: { in: boutiqueIds } } },
  });
  await tx.ligneCommandeFournisseur.deleteMany({
    where: { commande: { boutiqueId: { in: boutiqueIds } } },
  });
  await tx.ligneVenteFlash.deleteMany({
    where: { venteFlash: { boutiqueId: { in: boutiqueIds } } },
  });
  await tx.ligneFacture.deleteMany({
    where: { facture: { boutiqueId: { in: boutiqueIds } } },
  });
  await tx.mouvementStock.deleteMany({ where: inB });

  // 2) En-têtes de transactions (leurs lignes sont parties).
  await tx.commandeClient.deleteMany({ where: inB });
  await tx.commandeFournisseur.deleteMany({ where: inB }); // libère Fournisseur (Restrict)
  await tx.venteFlash.deleteMany({ where: inB });
  await tx.facture.deleteMany({ where: inB });

  // 3) Produit (plus aucune réf Restrict) + autres entités de boutique.
  await tx.produit.deleteMany({ where: inB });
  await tx.categorie.deleteMany({ where: inB });
  await tx.client.deleteMany({ where: inB });
  await tx.fournisseur.deleteMany({ where: inB });
  await tx.depense.deleteMany({ where: inB });
  await tx.resumeJournalier.deleteMany({ where: inB });
  await tx.membreBoutique.deleteMany({ where: inB }); // membres (staff) de ces boutiques

  // 4) Boutiques.
  await tx.boutique.deleteMany({ where: { id: { in: boutiqueIds } } });
}

/**
 * Suppression PHYSIQUE et complète d'un compte : boutiques possédées (données
 * incluses), profil vendeur, abonnements/paiements, jetons e-mail, staging
 * d'inscription, puis le User (cascade DB : Account/Session/Notification/
 * AiGeneration/AiUsage ; ActivityLog.userId → SetNull, l'audit est conservé
 * anonymisé). Après coup, l'e-mail est totalement LIBRE pour une réinscription.
 */
export async function deleteUserCascade(
  tx: Tx,
  target: {
    userId: string;
    email: string;
    vendeurId: string | null;
    boutiqueIds: string[];
  }
) {
  const { userId, email, vendeurId, boutiqueIds } = target;

  if (vendeurId) {
    await deleteBoutiquesData(tx, boutiqueIds);

    // Niveau vendeur.
    await tx.paiement.deleteMany({ where: { abonnement: { vendeurId } } });
    await tx.abonnement.deleteMany({ where: { vendeurId } });
    await tx.membreBoutique.deleteMany({ where: { vendeurId } }); // appartenances ailleurs (staff)
    await tx.vendeur.delete({ where: { id: vendeurId } });
  }

  // Jetons / staging liés à l'email → libère l'email pour la réinscription.
  await tx.verificationToken.deleteMany({ where: { identifier: email } });
  await tx.passwordResetToken.deleteMany({ where: { identifier: email } });
  await tx.pendingRegistration.deleteMany({ where: { email } });

  // User en dernier (cascades DB pour le reste).
  await tx.user.delete({ where: { id: userId } });
}
