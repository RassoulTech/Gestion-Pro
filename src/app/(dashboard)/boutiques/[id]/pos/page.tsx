import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Calculator } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBoutiqueOwnerQuotas } from "@/lib/quotas";
import { getBoutiqueProduits } from "@/server/queries/produit.queries";
import { PremiumGuard } from "@/components/dashboard/premium-guard";
import PosInterface from "./_components/pos-interface";

export const metadata: Metadata = { title: "Caisse Tactile" };

export default async function PosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  // On récupère le plan actuel du propriétaire de la boutique
  const quotas = await getBoutiqueOwnerQuotas(id);

  // Données de base
  const boutique = await prisma.boutique.findUnique({
    where: { id },
    select: { 
      id: true, 
      nom: true, 
      adresse: true, 
      telephone: true,
      ticketMessage: true 
    },
  });

  if (!boutique) redirect("/boutiques");

  // On récupère le nom du caissier
  const vendeur = await prisma.vendeur.findUnique({
    where: { userId: session.user.id },
    select: { prenom: true, nom: true },
  });
  const vendeurNom = vendeur ? `${vendeur.prenom} ${vendeur.nom}` : "Caissier";

  // Catégories
  const categories = await prisma.categorie.findMany({
    where: { boutiqueId: id },
    select: { id: true, nom: true, couleur: true },
    orderBy: { nom: "asc" },
  });

  // Tous les produits (on prend une limite haute pour charger le catalogue complet en client-side)
  const produitsRes = await getBoutiqueProduits(id, { perPage: 500 });
  
  // Formatage pour le composant client
  const initialProduits = produitsRes.data.map(p => ({
    id: p.id,
    nom: p.nom,
    prixUnitaire: p.prixUnitaire,
    quantite: p.quantite,
    categorieId: p.categorieId,
    categorie: p.categorie ? { nom: p.categorie.nom, couleur: p.categorie.couleur } : null
  }));

  return (
    <div className="flex flex-col h-full w-full max-w-[2000px] mx-auto">
      <PremiumGuard
        currentPlanName={quotas.nom}
        featureName="Caisse Tactile & Tickets"
        featureDescription="Passez au niveau supérieur : un terminal de caisse ultra-rapide avec gestion des remises, rendu-monnaie, et impression de tickets de caisse thermiques."
      >
        <PosInterface 
          boutique={boutique}
          initialProduits={initialProduits}
          categories={categories}
          vendeurNom={vendeurNom}
        />
      </PremiumGuard>
    </div>
  );
}
