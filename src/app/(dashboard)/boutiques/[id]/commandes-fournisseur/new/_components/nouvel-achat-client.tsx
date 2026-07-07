"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  Loader2, 
  ArrowLeft, 
  Search, 
  Calendar, 
  Truck,
  FileText
} from "lucide-react";
import Link from "next/link";

import { createCommandeFournisseur } from "@/server/actions/commande.actions";
import { createFournisseur } from "@/server/actions/fournisseur.actions";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Produit {
  id: string;
  nom: string;
  code: string;
  prixAchat: number;
  prixUnitaire: number;
  quantite: number;
}

interface Fournisseur {
  id: string;
  nom: string;
  telephone: string | null;
}

interface CartItem {
  produitId: string;
  nom: string;
  prixUnitaire: number;
  quantite: number;
}

interface NouvelAchatClientProps {
  boutiqueId: string;
  initialProduits: Produit[];
  initialFournisseurs: Fournisseur[];
}

export function NouvelAchatClient({
  boutiqueId,
  initialProduits,
  initialFournisseurs,
}: NouvelAchatClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>(initialFournisseurs);
  
  // Selection
  const [selectedFournisseurId, setSelectedFournisseurId] = useState<string>("");
  
  // Quick Supplier Dialog
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ nom: "", telephone: "", email: "", adresse: "", categorie: "", notes: "" });
  const [supplierLoading, setSupplierLoading] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  
  // Metadata fields
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [etat, setEtat] = useState<"LIVREE" | "EN_ATTENTE" | "VALIDEE">("LIVREE");

  // Filtering products
  const filteredProduits = initialProduits.filter((p) => {
    return (
      p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Cart operations
  function addToCart(produit: Produit) {
    setCart((prev) => {
      const existing = prev.find((item) => item.produitId === produit.id);
      if (existing) {
        return prev.map((item) =>
          item.produitId === produit.id ? { ...item, quantite: item.quantite + 1 } : item
        );
      }
      // Supplier purchase price defaults to the default purchase price (prixAchat)
      return [
        ...prev,
        {
          produitId: produit.id,
          nom: produit.nom,
          prixUnitaire: produit.prixAchat || Math.floor(produit.prixUnitaire * 0.6), // default fallback
          quantite: 1,
        },
      ];
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

  function updatePrice(produitId: string, price: number) {
    setCart((prev) =>
      prev.map((item) =>
        item.produitId === produitId ? { ...item, prixUnitaire: Math.max(0, price) } : item
      )
    );
  }

  function removeItem(produitId: string) {
    setCart((prev) => prev.filter((item) => item.produitId !== produitId));
  }

  const total = cart.reduce((sum, item) => sum + item.prixUnitaire * item.quantite, 0);

  // Quick supplier creation
  async function handleCreateSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!newSupplier.nom) {
      toast.error("Le nom du fournisseur est obligatoire");
      return;
    }
    setSupplierLoading(true);
    try {
      const res = await createFournisseur({
        boutiqueId,
        nom: newSupplier.nom,
        telephone: newSupplier.telephone || undefined,
        email: newSupplier.email || undefined,
        adresse: newSupplier.adresse || undefined,
        categorie: newSupplier.categorie || undefined,
        notes: newSupplier.notes || undefined,
      });

      if (!res) {
        toast.error("Erreur serveur : pas de réponse");
        return;
      }

      if (res.serverError) {
        toast.error(res.serverError);
        return;
      }

      const supplierCree = res.data;
      if (supplierCree) {
        setFournisseurs((prev) => [...prev, supplierCree]);
        setSelectedFournisseurId(supplierCree.id);
        toast.success("Fournisseur créé et sélectionné !");
        setSupplierDialogOpen(false);
        setNewSupplier({ nom: "", telephone: "", email: "", adresse: "", categorie: "", notes: "" });
      }
    } catch {
      toast.error("Erreur lors de la création du fournisseur");
    } finally {
      setSupplierLoading(false);
    }
  }

  // Submit
  function handleSubmit() {
    if (!selectedFournisseurId) {
      toast.error("Veuillez sélectionner un fournisseur");
      return;
    }
    if (cart.length === 0) {
      toast.error("Le panier est vide");
      return;
    }

    startTransition(async () => {
      try {
        // Prepend reference to notes for saving
        const consolidatedNotes = [
          reference ? `Réf: ${reference}` : "",
          notes
        ].filter(Boolean).join(" | ");

        const result = await createCommandeFournisseur({
          boutiqueId,
          data: {
            fournisseurId: selectedFournisseurId,
            notes: consolidatedNotes || undefined,
            date,
            etat,
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

        toast.success("Achat fournisseur enregistré avec succès !");
        router.push(`/boutiques/${boutiqueId}/commandes-fournisseur`);
        router.refresh();
      } catch {
        toast.error("Erreur lors de la création de la commande");
      }
    });
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" className="rounded-full h-12 w-12 p-0 shrink-0">
          <Link href={`/boutiques/${boutiqueId}/commandes-fournisseur`}>
            <ArrowLeft className="h-6 w-6" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Nouvel achat fournisseur</h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">Enregistrez un approvisionnement en stock auprès d&apos;un fournisseur.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Form details */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <Card className="border-none bg-white dark:bg-zinc-900 shadow-xl rounded-[2rem]">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-base sm:text-lg font-black">Informations de l&apos;Achat</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Supplier selection with inline create */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Fournisseur *</Label>
                    
                    <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
                      <DialogTrigger asChild>
                        <button className="text-xs font-black text-brand hover:underline flex items-center gap-0.5">
                          <Plus className="h-3.5 w-3.5" /> Créer
                        </button>
                      </DialogTrigger>
                      <DialogContent className="rounded-[1.5rem] sm:rounded-[2rem] max-w-md border-none shadow-2xl mx-4 sm:mx-auto">
                        <DialogHeader>
                          <DialogTitle className="text-lg font-black">Nouveau Fournisseur</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateSupplier} className="space-y-4 pt-2">
                          <div className="space-y-1">
                            <Label className="text-xs font-bold">Nom du Fournisseur *</Label>
                            <Input
                              placeholder="Ex: Diallo Import-Export"
                              className="h-11 rounded-xl bg-foreground/5 border-none font-bold"
                              value={newSupplier.nom}
                              onChange={(e) => setNewSupplier({ ...newSupplier, nom: e.target.value })}
                            />
                          </div>
                          <div className="grid gap-4 grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs font-bold">Téléphone</Label>
                              <Input
                                placeholder="Ex: +221 77 ..."
                                className="h-11 rounded-xl bg-foreground/5 border-none font-bold"
                                value={newSupplier.telephone}
                                onChange={(e) => setNewSupplier({ ...newSupplier, telephone: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-bold">Catégorie</Label>
                              <Input
                                placeholder="Ex: Boissons, Alimentation"
                                className="h-11 rounded-xl bg-foreground/5 border-none font-bold"
                                value={newSupplier.categorie}
                                onChange={(e) => setNewSupplier({ ...newSupplier, categorie: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-bold">Email</Label>
                            <Input
                              type="email"
                              placeholder="Ex: contact@fournisseur.com"
                              className="h-11 rounded-xl bg-foreground/5 border-none font-bold"
                              value={newSupplier.email}
                              onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-bold">Adresse</Label>
                            <Input
                              placeholder="Ex: Dakar, Grand Yoff"
                              className="h-11 rounded-xl bg-foreground/5 border-none font-bold"
                              value={newSupplier.adresse}
                              onChange={(e) => setNewSupplier({ ...newSupplier, adresse: e.target.value })}
                            />
                          </div>
                          <DialogFooter className="pt-2">
                            <Button type="submit" variant="brand" className="w-full h-11 rounded-xl font-bold" disabled={supplierLoading}>
                              {supplierLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Créer et Sélectionner
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <Select value={selectedFournisseurId} onValueChange={setSelectedFournisseurId}>
                    <SelectTrigger className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none font-bold text-sm">
                      <SelectValue placeholder="Choisir un fournisseur" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {fournisseurs.map((f) => (
                        <SelectItem key={f.id} value={f.id} className="rounded-lg font-bold">
                          <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-zinc-400" /> {f.nom} {f.telephone ? `(${f.telephone})` : ""}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-zinc-400" /> Date d&apos;achat
                  </Label>
                  <Input
                    type="date"
                    className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-bold text-sm"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Reference Number */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-zinc-400" /> Référence / Facture N°
                  </Label>
                  <Input
                    placeholder="Ex: FA-2026-0034"
                    className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-bold text-sm"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>

                {/* Order Status */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">État de livraison / Entrée de stock</Label>
                  <Select value={etat} onValueChange={(val: any) => setEtat(val)}>
                    <SelectTrigger className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none font-bold text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="LIVREE" className="rounded-lg font-bold text-emerald-600 dark:text-emerald-400"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Livrée (Stock incrémenté)</span></SelectItem>
                      <SelectItem value="VALIDEE" className="rounded-lg font-bold text-blue-600 dark:text-blue-400"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" /> Validée (Stock incrémenté)</span></SelectItem>
                      <SelectItem value="EN_ATTENTE" className="rounded-lg font-bold text-amber-600 dark:text-amber-400"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" /> En attente de livraison (Pas d&apos;entrée)</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Notes (optionnel)</Label>
                <Textarea
                  placeholder="Remarques sur le colis, le paiement, ou le transport..."
                  className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none resize-none font-medium text-sm"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Catalog Selection */}
          <Card className="border-none bg-white dark:bg-zinc-900 shadow-xl rounded-[2rem] overflow-hidden">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-base sm:text-lg font-black">Sélectionner les Produits</CardTitle>
              <CardDescription className="font-bold">Recherchez et ajoutez les articles achetés.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit par nom ou code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none font-bold text-sm"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredProduits.length > 0 ? (
                  filteredProduits.map((produit) => (
                    <div 
                      key={produit.id} 
                      onClick={() => addToCart(produit)}
                      className="p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 hover:border-brand/40 hover:bg-brand/5 cursor-pointer flex items-center justify-between transition-all group"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-black text-sm text-zinc-800 dark:text-zinc-100 truncate group-hover:text-brand transition-colors">{produit.nom}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{produit.code}</p>
                        <p className="text-xs font-black text-red-500 mt-1">PA: {formatCurrency(produit.prixAchat || 0)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                          Stock: {produit.quantite}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-sm text-muted-foreground font-bold">
                    Aucun produit trouvé
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Cart Summary */}
        <div className="lg:col-span-5 xl:col-span-4">
          <Card className="border-none bg-white dark:bg-zinc-900 shadow-2xl rounded-[2rem] overflow-hidden lg:sticky lg:top-24">
            <CardHeader className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800/50">
              <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-brand" /> Panier ({cart.length})
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6 space-y-5">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-muted-foreground">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-muted-foreground font-black">Le panier est vide</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.produitId} className="flex flex-col gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/20 text-sm">
                      <div className="flex justify-between items-start">
                        <p className="font-extrabold text-zinc-900 dark:text-zinc-50 truncate leading-tight flex-1 pr-2">{item.nom}</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive hover:bg-red-50 rounded-lg shrink-0" 
                          onClick={() => removeItem(item.produitId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-1">
                        {/* Purchase Price Input */}
                        <div className="flex items-center gap-1.5 w-1/2">
                          <span className="text-[10px] font-black text-muted-foreground uppercase">PA:</span>
                          <Input
                            type="number"
                            min={0}
                            value={item.prixUnitaire}
                            onChange={(e) => updatePrice(item.produitId, Number(e.target.value))}
                            className="h-8 rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-extrabold text-xs px-2 w-full text-red-500"
                          />
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 justify-end shrink-0 w-1/2">
                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => updateQuantite(item.produitId, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center font-black text-sm">{item.quantite}</span>
                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => updateQuantite(item.produitId, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-black uppercase">Total Achat</span>
                    <span className="text-2xl font-black text-red-600 dark:text-red-400 tracking-tight">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="p-6 bg-zinc-50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800/50">
              <Button 
                className="w-full h-14 rounded-xl font-black text-base shadow-xl shadow-brand/20 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-brand dark:hover:bg-brand/90" 
                disabled={!selectedFournisseurId || cart.length === 0 || isPending} 
                onClick={handleSubmit}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer l'achat"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
