"use client";

import Link from "next/link";
import Image from "next/image";
import { Package, ShoppingCart, Store, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { MarketplaceProduct } from "@/server/queries/marketplace.queries";

export function MarketplaceProductCard({ produit }: { produit: MarketplaceProduct }) {
  const { addItem } = useCart();
  const boutiqueLogo = produit.boutique.logo || produit.boutique.vendeur?.photo || null;
  const href = `/s/${produit.boutique.slug}/produits/${produit.id}`;
  const enStock = produit.quantite > 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      produitId: produit.id,
      boutiqueSlug: produit.boutique.slug,
      boutiqueNom: produit.boutique.nom,
      nom: produit.nom,
      prixUnitaire: produit.prixUnitaire,
      photo: produit.photo,
    });
    toast.success(`${produit.nom} ajouté au panier`);
  }

  return (
    <Link
      href={href}
      className="flex flex-col h-full rounded-2xl sm:rounded-[2rem] border border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm hover:shadow-xl hover:border-orange-500/25 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden group"
    >
      {/* Image */}
      <div className="aspect-square bg-slate-50 dark:bg-zinc-900/50 flex items-center justify-center relative overflow-hidden">
        {produit.photo ? (
          <Image
            src={produit.photo}
            alt={produit.nom}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            unoptimized
          />
        ) : (
          <Package className="h-14 w-14 text-slate-300 dark:text-zinc-700 transition-transform duration-500 group-hover:scale-105" />
        )}

        {/* Étiquettes en ligne au-dessus de l'image : la catégorie tronque
            pour ne jamais chevaucher l'étiquette de stock sur les cartes
            étroites (2 colonnes en mobile). */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {produit.categorie ? (
            <Badge className="min-w-0 max-w-[60%] rounded-full px-2.5 py-0.5 bg-white/90 dark:bg-zinc-900/90 text-orange-600 dark:text-orange-400 font-bold text-[9px] uppercase tracking-wider border border-orange-100 dark:border-orange-500/20 backdrop-blur-sm">
              <span className="block min-w-0 truncate">{produit.categorie.nom}</span>
            </Badge>
          ) : (
            <span aria-hidden />
          )}
          <Badge
            className={`shrink-0 rounded-full px-2.5 py-0.5 font-extrabold text-[9px] uppercase tracking-widest border-none ${
              enStock
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
            }`}
          >
            {enStock ? "En stock" : "Épuisé"}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 space-y-2">
        <h3 className="font-extrabold text-slate-800 dark:text-zinc-100 group-hover:text-orange-500 transition-colors line-clamp-2 min-h-[2.5rem] text-fluid-body leading-snug">
          {produit.nom}
        </h3>

        {produit.description && (
          <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed min-h-[2rem]">
            {produit.description}
          </p>
        )}

        <p className="text-fluid-body font-black text-orange-600 dark:text-orange-400 tracking-tight tabular-nums pt-0.5">
          {formatCurrency(produit.prixUnitaire)}
        </p>

        {/* Boutique row */}
        <div className="flex items-center gap-2 pt-1">
          <div className="h-6 w-6 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/50 flex items-center justify-center shrink-0 overflow-hidden relative">
            {boutiqueLogo ? (
              <Image
                src={boutiqueLogo}
                alt={produit.boutique.nom}
                fill
                className="object-cover"
                sizes="24px"
                loading="lazy"
                unoptimized
              />
            ) : (
              <Store className="h-3 w-3 text-orange-500" />
            )}
          </div>
          <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 truncate">
            {produit.boutique.nom}
          </span>
        </div>

        {produit.boutique.adresse && (
          <div className="flex items-center gap-1 text-slate-400 dark:text-zinc-500 text-[10px]">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{produit.boutique.adresse}</span>
          </div>
        )}

        {/* Footer actions — à 375px (2 colonnes), le bouton prend toute la
            largeur et le libellé « Voir détails » (redondant, la carte est
            cliquable) n'apparaît qu'à partir de sm. */}
        <div className="pt-3 mt-auto flex flex-col min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between gap-2.5 border-t border-slate-100/60 dark:border-zinc-800/50">
          <span className="hidden sm:inline text-[10px] font-extrabold text-orange-500 uppercase tracking-widest">
            Voir détails
          </span>
          <Button
            size="sm"
            className="w-full min-[380px]:w-auto rounded-xl px-3 h-9 font-extrabold text-[11px] bg-brand text-white border-none shadow-md shadow-brand/10 hover:shadow-brand/20 transition-all duration-300 flex items-center justify-center shrink-0"
            onClick={handleAddToCart}
            disabled={!enStock}
            aria-label={`Ajouter ${produit.nom} au panier`}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1" />
            Ajouter
          </Button>
        </div>
      </div>
    </Link>
  );
}
