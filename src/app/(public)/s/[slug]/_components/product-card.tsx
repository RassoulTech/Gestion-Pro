"use client";

import Link from "next/link";
import Image from "next/image";
import { Package, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface ProductCardProps {
  produit: {
    id: string;
    nom: string;
    description?: string | null;
    prixUnitaire: number;
    quantite: number;
    photo: string | null;
    categorie: { nom: string } | null;
  };
  boutiqueSlug: string;
  boutiqueNom: string;
}

export function ProductCard({ produit, boutiqueSlug, boutiqueNom }: ProductCardProps) {
  const { addItem } = useCart();

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
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
    <Link 
      href={`/s/${boutiqueSlug}/produits/${produit.id}`} 
      className="flex flex-col h-full rounded-[2rem] border border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm hover:shadow-xl hover:border-orange-500/25 hover:-translate-y-2 transition-all duration-300 overflow-hidden group"
    >
      <div className="aspect-square bg-slate-50 dark:bg-zinc-900/50 flex items-center justify-center relative overflow-hidden">
        {produit.photo ? (
          <Image
            src={produit.photo}
            alt={produit.nom}
            fill
            className="object-cover transition-transform duration-750 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <Package className="h-16 w-16 text-slate-300 dark:text-zinc-700 transition-transform duration-500 group-hover:scale-105" />
        )}
        
        <div className="absolute top-4 right-4">
          <Badge
            className={`rounded-full px-2.5 py-0.5 font-extrabold text-[9px] uppercase tracking-widest border-none ${
              produit.quantite > 0 
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                : "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
            }`}
          >
            {produit.quantite > 0 ? "Stock" : "Épuisé"}
          </Badge>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 space-y-2">
        <h3 className="font-extrabold text-slate-800 dark:text-zinc-100 group-hover:text-orange-500 transition-colors line-clamp-2 text-fluid-body leading-snug min-h-[2.5rem] flex items-center">
          {produit.nom}
        </h3>
        
        {produit.categorie && (
          <span className="inline-flex max-w-fit px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-500/10 text-[9px] font-bold text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20">
            {produit.categorie.nom}
          </span>
        )}
        
        {produit.description && (
          <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed min-h-[2rem]">
            {produit.description}
          </p>
        )}

        <div className="pt-3 mt-auto flex flex-col min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between gap-2.5 border-t border-slate-100/50 dark:border-zinc-800/50">
          <p className="text-fluid-body font-black text-orange-600 dark:text-orange-400 tracking-tight whitespace-nowrap">
            {formatCurrency(produit.prixUnitaire)}
          </p>
          
          <Button
            size="sm"
            className="w-full min-[380px]:w-auto rounded-xl px-3 h-9 font-extrabold text-[11px] bg-brand text-white border-none shadow-md shadow-brand/10 hover:shadow-brand/20 transition-all duration-300 flex items-center justify-center shrink-0"
            onClick={handleAddToCart}
            disabled={produit.quantite <= 0}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1" />
            Ajouter
          </Button>
        </div>
      </div>
    </Link>
  );
}
