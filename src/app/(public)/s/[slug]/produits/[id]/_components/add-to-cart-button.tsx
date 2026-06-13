"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";
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
  /** Surcharge de style (ex. version compacte pour la barre sticky mobile). */
  className?: string;
}

export function AddToCartButton({ produit, boutiqueSlug, boutiqueNom, disabled, className }: AddToCartButtonProps) {
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
      className={cn(
        "w-full h-16 rounded-2xl font-black text-lg bg-brand text-white shadow-xl shadow-brand/20 hover:bg-brand/90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-none",
        className
      )}
      onClick={handleClick}
      disabled={disabled}
    >
      <ShoppingCart className="mr-3 h-5 w-5" />
      Ajouter au panier
    </Button>
  );
}
