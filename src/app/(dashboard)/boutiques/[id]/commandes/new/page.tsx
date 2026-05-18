/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Minus, Trash2, ShoppingCart, Loader2 } from "lucide-react";
import { createCommandeClient } from "@/server/actions/commande.actions";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface CartItem {
  produitId: string;
  nom: string;
  prixUnitaire: number;
  quantite: number;
}

export default function NouvelleCommandePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const boutiqueId = params.id;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notes, setNotes] = useState("");

  // In production, this would fetch from API
 
  function addToCart(produit: { id: string; nom: string; prixUnitaire: number }) {
    setCart((prev) => {
      const existing = prev.find((item) => item.produitId === produit.id);
      if (existing) {
        return prev.map((item) =>
          item.produitId === produit.id ? { ...item, quantite: item.quantite + 1 } : item
        );
      }
      return [...prev, { produitId: produit.id, nom: produit.nom, prixUnitaire: produit.prixUnitaire, quantite: 1 }];
    });
  }

  function updateQuantite(produitId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.produitId === produitId ? { ...item, quantite: Math.max(0, item.quantite + delta) } : item
        )
        .filter((item) => item.quantite > 0)
    );
  }

  function removeItem(produitId: string) {
    setCart((prev) => prev.filter((item) => item.produitId !== produitId));
  }

  const total = cart.reduce((sum, item) => sum + item.prixUnitaire * item.quantite, 0);

  async function handleSubmit() {
    if (cart.length === 0) {
      toast.error("Ajoutez au moins un produit");
      return;
    }

    setLoading(true);
    try {
      const result = await createCommandeClient({
        boutiqueId,
        data: {
          notes: notes || undefined,
          lignes: cart.map((item) => ({
            produitId: item.produitId,
            quantite: item.quantite,
            prixUnitaire: item.prixUnitaire,
          })),
        },
      });

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }

      toast.success("Commande créée avec succès !");
      router.push(`/boutiques/${boutiqueId}/commandes`);
      router.refresh();
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold tracking-tight">Nouvelle commande</h1>
      <p className="text-sm text-muted-foreground">Créez une commande client</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Product Search */}
        <div className="lg:col-span-2 space-y-4">
          <Input
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Recherchez et ajoutez des produits au panier.
          </p>
        </div>

        {/* Cart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4" /> Panier ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Le panier est vide
              </p>
            ) : (
              cart.map((item) => (
                <div key={item.produitId} className="flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.nom}</p>
                    <p className="text-muted-foreground">{formatCurrency(item.prixUnitaire)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantite(item.produitId, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantite}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantite(item.produitId, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.produitId)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}

            {cart.length > 0 && (
              <>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </>
            )}

            <Input
              placeholder="Notes (optionnel)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled={cart.length === 0 || loading} onClick={handleSubmit}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Valider la commande
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
