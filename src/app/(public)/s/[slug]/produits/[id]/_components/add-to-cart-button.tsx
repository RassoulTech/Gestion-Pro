"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";

interface AddToCartButtonProps {
  produit: {
    id: string;
    nom: string;
    prixUnitaire: number;
    photo: string | null;
  };
  boutiqueSlug: string;
  boutiqueNom: string;
  disabled?: boolean;
}

export function AddToCartButton({ produit, boutiqueSlug, boutiqueNom, disabled }: AddToCartButtonProps) {
  const { addItem } = useCart();

  function handleClick() {
    addItem({
      produitId: produit.id,
      boutiqueSlug,
      boutiqueNom,
      nom: produit.nom,
      prixUnitaire: produit.prixUnitaire,
      photo: produit.photo,
    });
    toast.success(`${produit.nom} ajouté au panier`);
  }

  return (
    <Button
      size="xl"
      className="w-full h-16 rounded-2xl font-black text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-none"
      onClick={handleClick}
      disabled={disabled}
    >
      <ShoppingCart className="mr-3 h-5 w-5" />
      Ajouter au panier
    </Button>
  );
}
