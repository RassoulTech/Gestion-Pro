"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  X,
  CreditCard,
  CheckCircle2,
} from "lucide-react";

import { createCommandeClient } from "@/server/actions/commande.actions";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TicketImprimable } from "@/components/pos/ticket-imprimable";
import { useReactToPrint } from "react-to-print";

// ─── TYPES ────────────────────────────────────────────────────

interface Produit {
  id: string;
  nom: string;
  prixUnitaire: number;
  quantite: number;
  categorieId: string | null;
  categorie?: { nom: string; couleur: string | null } | null;
}

interface CartItem extends Produit {
  cartQty: number;
}

interface BoutiqueContextData {
  id: string;
  nom: string;
  adresse: string | null;
  telephone: string | null;
  ticketMessage: string | null;
}

// ─── COMPOSANT CAISSE TACTILE ─────────────────────────────────

export default function PosInterface({
  boutique,
  initialProduits,
  categories,
  vendeurNom,
}: {
  boutique: BoutiqueContextData;
  initialProduits: Produit[];
  categories: { id: string; nom: string; couleur: string | null }[];
  vendeurNom: string;
}) {
  const router = useRouter();

  // ─── ETAT DU PANIER ──────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [remise, setRemise] = useState<number>(0);
  const [montantRecu, setMontantRecu] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState("");
  
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);

  // ─── ETAT IMPRESSION ─────────────────────────────────────────
  const [ticketData, setTicketData] = useState<any>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Ticket_${ticketData?.commandeCode || "Caisse"}`,
    onAfterPrint: () => resetPos(),
  });

  // ─── CALCULS ─────────────────────────────────────────────────
  const subtotal = cart.reduce((sum, item) => sum + item.prixUnitaire * item.cartQty, 0);
  const total = Math.max(0, subtotal - remise);
  const monnaieRendue = montantRecu !== undefined && montantRecu > total ? montantRecu - total : 0;

  // ─── FILTRES ─────────────────────────────────────────────────
  const filteredProduits = initialProduits.filter((p) => {
    if (activeCategory !== "ALL" && p.categorieId !== activeCategory) return false;
    if (search && !p.nom.toLowerCase().includes(search.toLowerCase()) && !p.id.includes(search)) return false;
    return true;
  });

  // ─── ACTIONS PANIER ─────────────────────────────────────────
  const addToCart = (produit: Produit) => {
    if (produit.quantite <= 0) {
      toast.error("Stock épuisé !");
      return;
    }
    setCart((prev) => {
      const exist = prev.find((item) => item.id === produit.id);
      if (exist) {
        if (exist.cartQty >= produit.quantite) {
          toast.error(`Stock maximum atteint (${produit.quantite})`);
          return prev;
        }
        return prev.map((item) =>
          item.id === produit.id ? { ...item, cartQty: item.cartQty + 1 } : item
        );
      }
      return [...prev, { ...produit, cartQty: 1 }];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.cartQty + delta;
          if (newQty > item.quantite) {
            toast.error(`Stock maximum atteint (${item.quantite})`);
            return item;
          }
          return { ...item, cartQty: Math.max(0, newQty) };
        }
        return item;
      }).filter((item) => item.cartQty > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const resetPos = () => {
    setCart([]);
    setRemise(0);
    setMontantRecu(undefined);
    setNotes("");
    setShowTicketModal(false);
    setTicketData(null);
  };

  // ─── VALIDATION COMMANDE ────────────────────────────────────
  const handleValider = async () => {
    if (cart.length === 0) return toast.error("Le panier est vide");

    setLoading(true);
    try {
      const res = await createCommandeClient({
        boutiqueId: boutique.id,
        data: {
          lignes: cart.map((c) => ({
            produitId: c.id,
            quantite: c.cartQty,
            prixUnitaire: c.prixUnitaire,
          })),
          remise,
          montantRecu: montantRecu || undefined,
          monnaieRendue: montantRecu && montantRecu > total ? monnaieRendue : undefined,
          notes: notes || undefined,
        },
      });

      if (res?.serverError) {
        toast.error(res.serverError);
        setLoading(false);
        return;
      }

      toast.success("Vente enregistrée !");
      
      // Préparer les données pour le ticket
      setTicketData({
        boutique,
        commandeCode: res?.data?.code || "N/A",
        date: new Date().toISOString(),
        lignes: cart.map(c => ({ nom: c.nom, quantite: c.cartQty, prixUnitaire: c.prixUnitaire })),
        total,
        remise,
        montantRecu,
        monnaieRendue,
        vendeurNom
      });
      setShowTicketModal(true);

    } catch (e: any) {
      toast.error("Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] overflow-hidden gap-4 -mx-4 -mt-4 px-4 pt-4">
      {/* ─── ZONE GAUCHE : PRODUITS ───────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
        {/* Header filtres */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 space-y-3 z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit (Nom, Code)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-lg rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-none focus-visible:ring-1 focus-visible:ring-brand"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Badge
              variant={activeCategory === "ALL" ? "brand" : "secondary"}
              className="cursor-pointer whitespace-nowrap text-sm px-4 py-1.5"
              onClick={() => setActiveCategory("ALL")}
            >
              Tous
            </Badge>
            {categories.map((c) => (
              <Badge
                key={c.id}
                variant={activeCategory === c.id ? "brand" : "secondary"}
                className="cursor-pointer whitespace-nowrap text-sm px-4 py-1.5"
                onClick={() => setActiveCategory(c.id)}
              >
                {c.nom}
              </Badge>
            ))}
          </div>
        </div>

        {/* Grille Produits */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProduits.map((p) => (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className={`relative group bg-white dark:bg-zinc-900 rounded-xl p-3 border shadow-sm cursor-pointer transition-all hover:border-brand/50 hover:shadow-md ${
                  p.quantite <= 0 ? "opacity-50 grayscale border-red-200" : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                {p.quantite <= 0 && (
                  <div className="absolute top-2 right-2 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ÉPUISÉ
                  </div>
                )}
                <div className="h-20 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg mb-3 flex items-center justify-center">
                  <Package className="h-8 w-8 text-zinc-300" />
                </div>
                <h3 className="font-bold text-sm leading-tight line-clamp-2 mb-1">{p.nom}</h3>
                <div className="flex justify-between items-end mt-2">
                  <span className="font-black text-brand">{formatCurrency(p.prixUnitaire)}</span>
                  <span className="text-xs text-muted-foreground">{p.quantite} en stock</span>
                </div>
              </div>
            ))}
          </div>
          {filteredProduits.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-4 opacity-20" />
              <p>Aucun produit trouvé</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── ZONE DROITE : PANIER ──────────────────────────────────── */}
      <div className="w-full md:w-[400px] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden shrink-0">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
          <h2 className="font-black text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-brand" /> Ticket
          </h2>
          <Badge variant="secondary">{cart.length} articles</Badge>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400">
              <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
              <p>Panier vide</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 p-3 border border-zinc-100 dark:border-zinc-800 rounded-xl">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-sm leading-tight pr-4">{item.nom}</span>
                  <button onClick={() => removeFromCart(item.id)} className="text-zinc-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-black text-brand">{formatCurrency(item.prixUnitaire * item.cartQty)}</span>
                  <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-1">
                    <button onClick={() => updateCartQty(item.id, -1)} className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center font-bold text-sm">{item.cartQty}</span>
                    <button onClick={() => updateCartQty(item.id, 1)} className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Remise (FCFA)</Label>
              <Input
                type="number"
                min="0"
                value={remise || ""}
                onChange={(e) => setRemise(Number(e.target.value))}
                className="h-10 font-bold"
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Reçu (FCFA)</Label>
              <Input
                type="number"
                min="0"
                value={montantRecu || ""}
                onChange={(e) => setMontantRecu(Number(e.target.value))}
                className="h-10 font-bold"
                placeholder="Montant du client"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sous-total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {remise > 0 && (
              <div className="flex justify-between text-sm text-brand font-medium">
                <span>Remise</span>
                <span>-{formatCurrency(remise)}</span>
              </div>
            )}
            <div className="flex justify-between text-2xl font-black pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <span>Total</span>
              <span className="text-brand">{formatCurrency(total)}</span>
            </div>
            {montantRecu !== undefined && montantRecu > 0 && (
              <div className="flex justify-between text-sm pt-1">
                <span className="text-muted-foreground">À Rendre</span>
                <span className="font-bold">{formatCurrency(monnaieRendue)}</span>
              </div>
            )}
          </div>

          <Button 
            className="w-full h-14 text-lg font-black rounded-xl shadow-xl shadow-brand/20" 
            variant="brand"
            disabled={cart.length === 0 || loading}
            onClick={handleValider}
          >
            {loading ? "Enregistrement..." : "Payer & Imprimer"}
          </Button>
        </div>
      </div>

      {/* ─── MODAL TICKET ────────────────────────────────────────── */}
      <Dialog open={showTicketModal} onOpenChange={(open) => !open && resetPos()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" /> Vente enregistrée avec succès
            </DialogTitle>
            <DialogDescription>
              La commande a été validée. Vous pouvez maintenant imprimer le ticket de caisse.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center bg-zinc-50 p-4 rounded-xl border border-zinc-100 max-h-[50vh] overflow-y-auto">
            {ticketData && (
              <TicketImprimable ref={printRef} {...ticketData} />
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={resetPos}>
              Nouvelle vente
            </Button>
            <Button variant="brand" className="flex-1" onClick={() => handlePrint()}>
              <Printer className="mr-2 h-4 w-4" /> Imprimer Ticket
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
