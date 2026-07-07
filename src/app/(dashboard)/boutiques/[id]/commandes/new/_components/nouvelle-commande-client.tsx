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
  User, 
  Search, 
  Calendar, 
  CreditCard,
  Notebook,
  Banknote,
  Wallet,
  ShoppingBag,
  Gift
} from "lucide-react";
import Link from "next/link";
import { WaveIcon, OrangeMoneyIcon } from "@/components/icons/brand-icons";

import { createCommandeClient } from "@/server/actions/commande.actions";
import { createClient } from "@/server/actions/client.actions";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  prixUnitaire: number;
  quantite: number;
}

interface Client {
  id: string;
  nom: string;
  prenom: string | null;
  telephone: string | null;
}

interface CartItem {
  produitId: string;
  nom: string;
  prixUnitaire: number;
  quantite: number;
  stockDisponible: number;
}

interface NouvelleCommandeClientProps {
  boutiqueId: string;
  initialProduits: Produit[];
  initialClients: Client[];
}

export function NouvelleCommandeClient({
  boutiqueId,
  initialProduits,
  initialClients,
}: NouvelleCommandeClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clients, setClients] = useState<Client[]>(initialClients);
  
  // Client selection
  const [selectedClientId, setSelectedClientId] = useState<string>("WALK_IN");
  
  // Quick Client Dialog
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({ nom: "", prenom: "", telephone: "", email: "", adresse: "" });
  const [clientLoading, setClientLoading] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  
  // Metadata fields
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [etat, setEtat] = useState<"EN_ATTENTE" | "VALIDEE" | "LIVREE">("VALIDEE");
  const [modePaiement, setModePaiement] = useState<string>("ESPECES");
  const [notes, setNotes] = useState("");
  const [remise, setRemise] = useState<number>(0);

  // Products filtering
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
        if (existing.quantite >= produit.quantite) {
          toast.error(`Stock maximum atteint (${produit.quantite} disponibles)`);
          return prev;
        }
        return prev.map((item) =>
          item.produitId === produit.id ? { ...item, quantite: item.quantite + 1 } : item
        );
      }
      if (produit.quantite <= 0) {
        toast.error("Produit en rupture de stock");
        return prev;
      }
      return [
        ...prev,
        {
          produitId: produit.id,
          nom: produit.nom,
          prixUnitaire: produit.prixUnitaire,
          quantite: 1,
          stockDisponible: produit.quantite,
        },
      ];
    });
  }

  function updateQuantite(produitId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.produitId === produitId) {
            const nextQty = item.quantite + delta;
            if (nextQty > item.stockDisponible) {
              toast.error(`Stock maximum atteint (${item.stockDisponible} disponibles)`);
              return item;
            }
            return { ...item, quantite: Math.max(0, nextQty) };
          }
          return item;
        })
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

  // Totals calculations
  const subtotal = cart.reduce((sum, item) => sum + item.prixUnitaire * item.quantite, 0);
  const total = Math.max(0, subtotal - remise);

  // Quick client creation
  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    if (!newClient.nom) {
      toast.error("Le nom du client est obligatoire");
      return;
    }
    setClientLoading(true);
    try {
      const res = await createClient({
        boutiqueId,
        nom: newClient.nom,
        prenom: newClient.prenom || undefined,
        telephone: newClient.telephone || undefined,
        email: newClient.email || undefined,
        adresse: newClient.adresse || undefined,
      });

      if (!res) {
        toast.error("Erreur serveur : pas de réponse");
        return;
      }

      if (res.serverError) {
        toast.error(res.serverError);
        return;
      }

      const clientCree = res.data;
      if (clientCree) {
        setClients((prev) => [...prev, clientCree]);
        setSelectedClientId(clientCree.id);
        toast.success("Client créé et sélectionné !");
        setClientDialogOpen(false);
        setNewClient({ nom: "", prenom: "", telephone: "", email: "", adresse: "" });
      }
    } catch {
      toast.error("Erreur lors de la création du client");
    } finally {
      setClientLoading(false);
    }
  }

  // Form submit
  function handleSubmit() {
    if (cart.length === 0) {
      toast.error("Le panier est vide");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createCommandeClient({
          boutiqueId,
          data: {
            clientId: selectedClientId === "WALK_IN" ? undefined : selectedClientId,
            notes: notes || undefined,
            remise: remise || 0,
            date,
            etat,
            modePaiement,
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

        toast.success("Commande enregistrée avec succès !");
        router.push(`/boutiques/${boutiqueId}/commandes`);
        router.refresh();
      } catch {
        toast.error("Erreur lors de la création de la commande");
      }
    });
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" className="rounded-full h-12 w-12 p-0 shrink-0">
          <Link href={`/boutiques/${boutiqueId}/commandes`}>
            <ArrowLeft className="h-6 w-6" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Ajouter une commande</h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">Saisissez manuellement une vente physique ou hors plateforme.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Form Details & Products */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          
          {/* Section 1: Customer & Logistics Info */}
          <Card className="border-none bg-white dark:bg-zinc-900 shadow-xl rounded-[2rem]">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-base sm:text-lg font-black">Informations de la Vente</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Client Dropdown with inline creation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Client</Label>
                    
                    {/* Add Client Dialog */}
                    <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
                      <DialogTrigger asChild>
                        <button className="text-xs font-black text-brand hover:underline flex items-center gap-0.5">
                          <Plus className="h-3.5 w-3.5" /> Créer
                        </button>
                      </DialogTrigger>
                      <DialogContent className="rounded-[1.5rem] sm:rounded-[2rem] max-w-md border-none shadow-2xl mx-4 sm:mx-auto">
                        <DialogHeader>
                          <DialogTitle className="text-lg font-black">Nouveau Client</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateClient} className="space-y-4 pt-2">
                          <div className="grid gap-4 grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs font-bold">Prénom</Label>
                              <Input
                                placeholder="Ex: Jean"
                                className="h-11 rounded-xl bg-foreground/5 border-none font-bold"
                                value={newClient.prenom}
                                onChange={(e) => setNewClient({ ...newClient, prenom: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-bold">Nom *</Label>
                              <Input
                                placeholder="Ex: Dupont"
                                className="h-11 rounded-xl bg-foreground/5 border-none font-bold"
                                value={newClient.nom}
                                onChange={(e) => setNewClient({ ...newClient, nom: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-bold">Téléphone</Label>
                            <Input
                              placeholder="Ex: +221 77 000 00 00"
                              className="h-11 rounded-xl bg-foreground/5 border-none font-bold"
                              value={newClient.telephone}
                              onChange={(e) => setNewClient({ ...newClient, telephone: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-bold">Email</Label>
                            <Input
                              type="email"
                              placeholder="Ex: jean.dupont@email.com"
                              className="h-11 rounded-xl bg-foreground/5 border-none font-bold"
                              value={newClient.email}
                              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-bold">Adresse</Label>
                            <Input
                              placeholder="Ex: Dakar, Plateau"
                              className="h-11 rounded-xl bg-foreground/5 border-none font-bold"
                              value={newClient.adresse}
                              onChange={(e) => setNewClient({ ...newClient, adresse: e.target.value })}
                            />
                          </div>
                          <DialogFooter className="pt-2">
                            <Button type="submit" variant="brand" className="w-full h-11 rounded-xl font-bold" disabled={clientLoading}>
                              {clientLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Créer et Sélectionner
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none font-bold text-sm">
                      <SelectValue placeholder="Choisir un client" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="WALK_IN" className="rounded-lg font-bold">
                        <span className="flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-zinc-400" /> Client occasionnel (Anonyme)</span>
                      </SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="rounded-lg font-bold">
                          <span className="flex items-center gap-2"><User className="h-4 w-4 text-zinc-400" /> {c.prenom ? `${c.prenom} ` : ""}{c.nom} {c.telephone ? `(${c.telephone})` : ""}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-zinc-400" /> Date d&apos;enregistrement
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
                {/* Order Status */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Statut de la commande</Label>
                  <Select value={etat} onValueChange={(val: any) => setEtat(val)}>
                    <SelectTrigger className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none font-bold text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="VALIDEE" className="rounded-lg font-bold text-emerald-600 dark:text-emerald-400"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Validée (Payée)</span></SelectItem>
                      <SelectItem value="LIVREE" className="rounded-lg font-bold text-blue-600 dark:text-blue-400"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" /> Livrée (Finalisée)</span></SelectItem>
                      <SelectItem value="EN_ATTENTE" className="rounded-lg font-bold text-amber-600 dark:text-amber-400"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" /> En Attente</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Mode */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                    <CreditCard className="h-3.5 w-3.5 text-zinc-400" /> Mode de paiement
                  </Label>
                  <Select value={modePaiement} onValueChange={setModePaiement}>
                    <SelectTrigger className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none font-bold text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="ESPECES" className="rounded-lg font-bold">
                        <span className="flex items-center gap-2"><Banknote className="h-4 w-4 text-emerald-500" /> Espèces / Physique</span>
                      </SelectItem>
                      <SelectItem value="MOBILE_MONEY" className="rounded-lg font-bold">
                        <span className="flex items-center gap-2"><WaveIcon className="h-4 w-4 rounded-sm" /><OrangeMoneyIcon className="h-4 w-4" /> Wave / Orange Money</span>
                      </SelectItem>
                      <SelectItem value="CARTE" className="rounded-lg font-bold">
                        <span className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-500" /> Carte bancaire</span>
                      </SelectItem>
                      <SelectItem value="AUTRE" className="rounded-lg font-bold">
                        <span className="flex items-center gap-2"><Wallet className="h-4 w-4 text-zinc-400" /> Autre moyen</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <Notebook className="h-3.5 w-3.5 text-zinc-400" /> Notes sur la commande (optionnel)
                </Label>
                <Textarea
                  placeholder="Canal de vente (ex: Vendu sur WhatsApp), détails de livraison, etc."
                  className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none resize-none font-medium text-sm"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Products Search & Selection */}
          <Card className="border-none bg-white dark:bg-zinc-900 shadow-xl rounded-[2rem] overflow-hidden">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-base sm:text-lg font-black">Catalogue Produits</CardTitle>
              <CardDescription className="font-bold">Recherchez et ajoutez des produits au panier.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit par nom ou code barre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none font-bold text-sm"
                />
              </div>

              {/* Products List Grid */}
              <div className="grid gap-3 sm:grid-cols-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredProduits.length > 0 ? (
                  filteredProduits.map((produit) => {
                    const inCartQty = cart.find(i => i.produitId === produit.id)?.quantite || 0;
                    const displayStock = produit.quantite - inCartQty;
                    return (
                      <div 
                        key={produit.id} 
                        onClick={() => addToCart(produit)}
                        className="p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 hover:border-brand/40 dark:hover:border-brand/40 hover:bg-brand/5 dark:hover:bg-brand/5 cursor-pointer flex items-center justify-between transition-all group"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-black text-sm text-zinc-800 dark:text-zinc-100 truncate group-hover:text-brand transition-colors">{produit.nom}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{produit.code}</p>
                          <p className="text-xs font-black text-emerald-500 mt-1">{formatCurrency(produit.prixUnitaire)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md ${
                            displayStock > 5 
                              ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" 
                              : displayStock > 0 
                                ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400" 
                                : "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400"
                          }`}>
                            {displayStock > 0 ? `${displayStock} dispo` : "Rupture"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-8 text-sm text-muted-foreground font-bold">
                    Aucun produit trouvé
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sticky Cart Summary */}
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
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-zinc-900 dark:text-zinc-50 truncate leading-tight">{item.nom}</p>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stock: {item.stockDisponible}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 rounded-lg shrink-0" 
                          onClick={() => removeItem(item.produitId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-1">
                        {/* Price Input (Vendor can modify selling price manually) */}
                        <div className="flex items-center gap-1.5 w-1/2">
                          <span className="text-[10px] font-black text-muted-foreground uppercase">PU:</span>
                          <Input
                            type="number"
                            min={0}
                            value={item.prixUnitaire}
                            onChange={(e) => updatePrice(item.produitId, Number(e.target.value))}
                            className="h-8 rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-extrabold text-xs px-2 w-full text-emerald-500"
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
                  {/* Subtotal */}
                  <div className="flex justify-between text-xs font-bold text-zinc-500">
                    <span>Sous-total</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>

                  {/* Remise / Reduction */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-zinc-500 flex items-center gap-1 shrink-0">
                      <Gift className="h-3.5 w-3.5 text-zinc-400" /> Réduction (FCFA)
                    </span>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={remise || ""}
                      onChange={(e) => setRemise(Math.max(0, Number(e.target.value)))}
                      className="h-9 rounded-lg bg-zinc-50 dark:bg-zinc-800 border-none font-extrabold text-xs text-right text-red-500 px-3 max-w-[100px]"
                    />
                  </div>

                  <Separator className="my-2" />

                  {/* Final Total */}
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-black uppercase">Net à Payer</span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="p-6 bg-zinc-50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800/50">
              <Button 
                className="w-full h-14 rounded-xl font-black text-base shadow-xl shadow-brand/20 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-brand dark:hover:bg-brand/90" 
                disabled={cart.length === 0 || isPending} 
                onClick={handleSubmit}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Valider la commande"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
