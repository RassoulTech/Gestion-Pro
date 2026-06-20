"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Package, ShoppingBag, CreditCard, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/utils";

export function CartClient() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-16 sm:py-24">
        <div className="w-full max-w-xl mx-auto px-4 text-center">
          <div className="relative p-6 sm:p-10 lg:p-16 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-[2rem] sm:rounded-[3rem] shadow-xl overflow-hidden">
            {/* Background design glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-gradient-to-br from-[#EA580C]/10 to-[#F59E0B]/10 blur-3xl rounded-full pointer-events-none" />
            
            <div className="relative z-10 space-y-6">
              <div className="mx-auto h-24 w-24 rounded-full bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/50 flex items-center justify-center text-orange-500 shadow-inner">
                <ShoppingCart className="h-10 w-10 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">Votre panier est vide</h1>
                <p className="text-sm sm:text-base text-slate-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Explorez le marketplace de GestionPro pour découvrir des boutiques de confiance et ajouter des articles.
                </p>
              </div>
              <Button asChild variant="brand" className="rounded-2xl px-8 h-13 font-black shadow-lg shadow-orange-500/20 w-full sm:w-auto">
                <Link href="/marketplace">
                  <ShoppingBag className="mr-2.5 h-5 w-5" />
                  Explorer le marketplace
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-10 sm:mb-14">
          <Button asChild variant="ghost" className="rounded-2xl font-bold group mb-6 px-4 py-2 hover:bg-slate-100/50 dark:hover:bg-zinc-800/50">
            <Link href="/marketplace" className="inline-flex items-center">
              <ArrowLeft className="mr-2 h-4.5 w-4.5 transition-transform group-hover:-translate-x-1" />
              Retour au marketplace
            </Link>
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
            <h1 className="text-fluid-h1 sm:text-fluid-display font-black tracking-tight text-slate-900 dark:text-white">
              Votre panier
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 font-bold text-fluid-caption sm:text-fluid-body bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-4 py-1.5 rounded-full shadow-sm w-fit">
              {totalItems} article{totalItems > 1 ? "s" : ""} sélectionné{totalItems > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 items-start">
          {/* Cart Items list */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.produitId}
                className="group relative flex flex-col sm:flex-row gap-5 p-5 sm:p-6 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                {/* Soft glow background */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-orange-500/5 blur-3xl rounded-full pointer-events-none" />

                {/* Product Image */}
                <div className="flex-shrink-0 h-24 w-24 sm:h-32 sm:w-32 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/50 flex items-center justify-center overflow-hidden relative shadow-inner">
                  {item.photo ? (
                    <Image src={item.photo} alt={item.nom} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                  ) : (
                    <Package className="h-10 w-10 text-slate-400" />
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold text-slate-800 dark:text-zinc-100 text-fluid-subtitle line-clamp-2 group-hover:text-orange-500 transition-colors">
                          {item.nom}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 mt-0.5 uppercase tracking-wider flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-orange-500" />
                          {item.boutiqueNom}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.produitId)}
                        className="flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all border border-transparent hover:border-red-100 dark:hover:border-red-500/20"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-50 dark:border-zinc-800/80">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 p-1 w-fit">
                      <button
                        onClick={() => updateQuantity(item.produitId, Math.max(1, item.quantite - 1))}
                        disabled={item.quantite <= 1}
                        className="h-10 w-10 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 border border-transparent active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
                        aria-label="Diminuer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-black text-slate-800 dark:text-zinc-100 select-none">
                        {item.quantite}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.produitId, item.quantite + 1)}
                        className="h-10 w-10 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 border border-transparent active:scale-95 transition-all shadow-sm"
                        aria-label="Augmenter"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">Sous-total</span>
                      <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        {formatCurrency(item.prixUnitaire * item.quantite)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Panel Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2.5rem] p-7 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-gradient-to-br from-[#EA580C]/10 to-[#F59E0B]/10 blur-3xl rounded-full pointer-events-none" />

              <h2 className="text-xl font-black text-slate-800 dark:text-zinc-100 mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-500" />
                Résumé de commande
              </h2>

              <div className="space-y-4 mb-6 max-h-48 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.produitId} className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-slate-500 dark:text-zinc-400 font-bold truncate mr-3">
                      {item.nom} <span className="text-[10px] font-black text-orange-500 px-1.5 py-0.5 bg-orange-50 dark:bg-orange-500/10 rounded-md">x{item.quantite}</span>
                    </span>
                    <span className="font-extrabold text-slate-800 dark:text-zinc-200 flex-shrink-0">
                      {formatCurrency(item.prixUnitaire * item.quantite)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-5 mb-8">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider block">Total TTC</span>
                    <span className="text-xs text-slate-400">Taxes incluses</span>
                  </div>
                  <span className="text-3xl font-black text-orange-600 dark:text-orange-400 tracking-tight">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  asChild
                  size="lg"
                  variant="brand"
                  className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-[#EA580C] to-[#F59E0B] hover:from-[#EA580C]/90 hover:to-[#F59E0B]/90 text-white border-none"
                >
                  <Link href="/checkout" className="inline-flex items-center justify-center">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Finaliser la commande
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full h-14 rounded-2xl font-bold border-slate-200 dark:border-zinc-800 text-xs sm:text-sm bg-slate-50/50 hover:bg-slate-100/50 dark:bg-zinc-800/20 inline-flex items-center justify-center"
                >
                  <Link href="/marketplace" className="inline-flex items-center justify-center">
                    Continuer mes achats
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Added local import mapping mock to keep typescript happy
function Store(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
    </svg>
  );
}
