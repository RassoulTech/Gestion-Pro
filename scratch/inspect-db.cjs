const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const boutiques = await prisma.boutique.findMany({
      include: {
        vendeur: true,
        produits: true,
        clients: true,
        commandesClient: {
          include: {
            client: true,
            lignes: {
              include: {
                produit: true
              }
            }
          }
        }
      }
    });

    console.log("BOUTIQUES:");
    for (const b of boutiques) {
      console.log(`- Nom: ${b.nom}, Slug: ${b.slug}, ID: ${b.id}`);
      console.log(`  Produits (${b.produits.length}):`);
      for (const p of b.produits) {
        console.log(`    * ${p.nom} - ${p.prixUnitaire} FCFA (Stock: ${p.quantite})`);
      }
      console.log(`  Clients (${b.clients.length}):`);
      for (const c of b.clients) {
        console.log(`    * ${c.nom} ${c.prenom} (${c.telephone})`);
      }
      console.log(`  Commandes (${b.commandesClient.length}):`);
      for (const c of b.commandesClient) {
        console.log(`    * Commande ${c.code} - Client: ${c.client?.nom} - Total: ${c.total} FCFA - Statut: ${c.etat}`);
      }
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
