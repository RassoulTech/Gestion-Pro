"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Package, PenLine, Loader2, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, formatCurrency } from "@/lib/utils";
import { createFacture } from "@/server/actions/facture.actions";

interface ClientOption {
  id: string;
  nom: string;
  prenom: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
}
interface ProduitOption {
  id: string;
  nom: string;
  prixUnitaire: number;
  quantite: number;
  code: string;
}
interface Ligne {
  uid: string;
  produitId: string | null;
  designation: string;
  quantite: number;
  prixUnitaire: number;
}

const uid = () => Math.random().toString(36).slice(2, 9);

export function FactureForm({
  boutiqueId,
  clients,
  produits,
}: {
  boutiqueId: string;
  clients: ClientOption[];
  produits: ProduitOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [clientMode, setClientMode] = useState<"existing" | "quick">(
    clients.length > 0 ? "existing" : "quick"
  );
  const [clientId, setClientId] = useState("");
  const [quick, setQuick] = useState({ nom: "", telephone: "", email: "", adresse: "" });

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [statut, setStatut] = useState<"BROUILLON" | "PAYEE" | "IMPAYEE">("BROUILLON");
  const [remise, setRemise] = useState(0);
  const [tauxTva, setTauxTva] = useState(0);
  const [notes, setNotes] = useState("");
  const [deduireStock, setDeduireStock] = useState(false);

  const [lignes, setLignes] = useState<Ligne[]>([
    { uid: uid(), produitId: null, designation: "", quantite: 1, prixUnitaire: 0 },
  ]);

  const totals = useMemo(() => {
    const sousTotal = lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0);
    const base = Math.max(0, sousTotal - remise);
    const montantTva = Math.round((base * tauxTva) / 100);
    return { sousTotal, montantTva, total: base + montantTva };
  }, [lignes, remise, tauxTva]);

  function addProduitLine() {
    setLignes((l) => [...l, { uid: uid(), produitId: "", designation: "", quantite: 1, prixUnitaire: 0 }]);
  }
  function addCustomLine() {
    setLignes((l) => [...l, { uid: uid(), produitId: null, designation: "", quantite: 1, prixUnitaire: 0 }]);
  }
  function removeLine(u: string) {
    setLignes((l) => (l.length > 1 ? l.filter((x) => x.uid !== u) : l));
  }
  function patchLine(u: string, patch: Partial<Ligne>) {
    setLignes((l) => l.map((x) => (x.uid === u ? { ...x, ...patch } : x)));
  }
  function selectProduit(u: string, produitId: string) {
    const p = produits.find((x) => x.id === produitId);
    patchLine(u, {
      produitId,
      designation: p ? p.nom : "",
      prixUnitaire: p ? p.prixUnitaire : 0,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cleanLignes = lignes
      .filter((l) => l.designation.trim() && l.quantite > 0)
      .map((l) => ({
        produitId: l.produitId || undefined,
        designation: l.designation.trim(),
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
      }));

    if (cleanLignes.length === 0) {
      toast.error("Ajoutez au moins une ligne valide (désignation + quantité).");
      return;
    }
    if (clientMode === "existing" && !clientId) {
      toast.error("Sélectionnez un client ou passez en saisie rapide.");
      return;
    }

    setLoading(true);
    try {
      const result = await createFacture({
        boutiqueId,
        data: {
          clientId: clientMode === "existing" ? clientId : undefined,
          clientNom: clientMode === "quick" ? quick.nom || undefined : undefined,
          clientTelephone: clientMode === "quick" ? quick.telephone || undefined : undefined,
          clientEmail: clientMode === "quick" ? quick.email || undefined : undefined,
          clientAdresse: clientMode === "quick" ? quick.adresse || undefined : undefined,
          date,
          statut,
          remise,
          tauxTva,
          notes: notes || undefined,
          deduireStock,
          lignes: cleanLignes,
        },
      });

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      if (result?.validationErrors) {
        toast.error("Vérifiez les champs du formulaire.");
        return;
      }
      const created = result?.data;
      toast.success(`Facture ${created?.numero ?? ""} créée`);
      router.push(`/boutiques/${boutiqueId}/factures/${created?.id}`);
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  const card = "bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] p-5 sm:p-6 shadow-sm";
  const field = "h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm";

  return (
    <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        {/* Client */}
        <div className={card}>
          <h2 className="text-sm font-black uppercase tracking-wider text-zinc-400 mb-4">Client</h2>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setClientMode("existing")}
              className={cn(
                "flex-1 h-11 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-colors",
                clientMode === "existing" ? "bg-brand text-white border-brand" : "bg-zinc-50 dark:bg-zinc-800 border-transparent text-zinc-600 dark:text-zinc-300"
              )}
            >
              <User className="h-4 w-4" /> Client existant
            </button>
            <button
              type="button"
              onClick={() => setClientMode("quick")}
              className={cn(
                "flex-1 h-11 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-colors",
                clientMode === "quick" ? "bg-brand text-white border-brand" : "bg-zinc-50 dark:bg-zinc-800 border-transparent text-zinc-600 dark:text-zinc-300"
              )}
            >
              <UserPlus className="h-4 w-4" /> Saisie rapide
            </button>
          </div>

          {clientMode === "existing" ? (
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className={cn(field, "w-full")}
            >
              <option value="">— Sélectionner un client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {[c.prenom, c.nom].filter(Boolean).join(" ")} {c.telephone ? `· ${c.telephone}` : ""}
                </option>
              ))}
            </select>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold">Nom du client</Label>
                <Input className={field} value={quick.nom} onChange={(e) => setQuick({ ...quick, nom: e.target.value })} placeholder="Ex. Awa Ndiaye" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Téléphone</Label>
                <Input className={field} value={quick.telephone} onChange={(e) => setQuick({ ...quick, telephone: e.target.value })} placeholder="+221…" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Email</Label>
                <Input className={field} value={quick.email} onChange={(e) => setQuick({ ...quick, email: e.target.value })} placeholder="email@exemple.com" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold">Adresse</Label>
                <Input className={field} value={quick.adresse} onChange={(e) => setQuick({ ...quick, adresse: e.target.value })} placeholder="Adresse (optionnel)" />
              </div>
            </div>
          )}
        </div>

        {/* Lignes */}
        <div className={card}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-400">Articles & prestations</h2>
          </div>
          <div className="space-y-3">
            {lignes.map((l) => {
              const isProduit = l.produitId !== null;
              const stockProduit = produits.find((p) => p.id === l.produitId);
              return (
                <div key={l.uid} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 p-3 sm:p-4 space-y-3 bg-zinc-50/40 dark:bg-zinc-800/20">
                  <div className="flex items-center gap-2">
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase", isProduit ? "bg-brand/10 text-brand" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300")}>
                      {isProduit ? <Package className="h-3 w-3" /> : <PenLine className="h-3 w-3" />}
                      {isProduit ? "Produit" : "Ligne libre"}
                    </span>
                    <button type="button" onClick={() => removeLine(l.uid)} className="ml-auto text-zinc-300 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {isProduit ? (
                    <select value={l.produitId ?? ""} onChange={(e) => selectProduit(l.uid, e.target.value)} className={cn(field, "w-full")}>
                      <option value="">— Choisir un produit —</option>
                      {produits.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nom} · {formatCurrency(p.prixUnitaire)} (stock {p.quantite})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      className={field}
                      value={l.designation}
                      onChange={(e) => patchLine(l.uid, { designation: e.target.value })}
                      placeholder="Ex. Réparation téléphone, Livraison, Service technique…"
                    />
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-zinc-500">Quantité</Label>
                      <Input
                        type="number"
                        min={1}
                        className={field}
                        value={l.quantite}
                        onChange={(e) => patchLine(l.uid, { quantite: Math.max(1, Number(e.target.value) || 1) })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-zinc-500">Prix unitaire</Label>
                      <Input
                        type="number"
                        min={0}
                        className={field}
                        value={l.prixUnitaire}
                        onChange={(e) => patchLine(l.uid, { prixUnitaire: Math.max(0, Number(e.target.value) || 0) })}
                      />
                    </div>
                  </div>

                  {isProduit && deduireStock && stockProduit && l.quantite > stockProduit.quantite && (
                    <p className="text-[11px] font-bold text-red-500">Stock insuffisant ({stockProduit.quantite} disponible).</p>
                  )}

                  <div className="text-right text-xs font-black text-zinc-700 dark:text-zinc-300">
                    Sous-total : {formatCurrency(l.quantite * l.prixUnitaire)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button type="button" variant="outline" onClick={addProduitLine} className="rounded-xl h-11 font-bold flex-1">
              <Package className="mr-2 h-4 w-4" /> Ajouter un produit
            </Button>
            <Button type="button" variant="outline" onClick={addCustomLine} className="rounded-xl h-11 font-bold flex-1">
              <PenLine className="mr-2 h-4 w-4" /> Ligne personnalisée
            </Button>
          </div>
        </div>

        {/* Notes */}
        <div className={card}>
          <h2 className="text-sm font-black uppercase tracking-wider text-zinc-400 mb-4">Notes (optionnel)</h2>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Conditions, mode de paiement, mentions…"
            className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none p-4 font-semibold text-sm min-h-[90px]"
          />
        </div>
      </div>

      {/* Sidebar : récap */}
      <div className="lg:col-span-1">
        <div className={cn(card, "lg:sticky lg:top-6 space-y-4")}>
          <h2 className="text-sm font-black uppercase tracking-wider text-zinc-400">Récapitulatif</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Date</Label>
              <Input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Statut</Label>
              <select className={cn(field, "w-full")} value={statut} onChange={(e) => setStatut(e.target.value as typeof statut)}>
                <option value="BROUILLON">Brouillon</option>
                <option value="PAYEE">Payée</option>
                <option value="IMPAYEE">Impayée</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Remise (FCFA)</Label>
            <Input type="number" min={0} className={field} value={remise} onChange={(e) => setRemise(Math.max(0, Number(e.target.value) || 0))} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">TVA</Label>
            <div className="flex gap-2">
              {[0, 18].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTauxTva(t)}
                  className={cn("flex-1 h-10 rounded-xl text-xs font-black border", tauxTva === t ? "bg-brand text-white border-brand" : "bg-zinc-50 dark:bg-zinc-800 border-transparent text-zinc-600 dark:text-zinc-300")}
                >
                  {t === 0 ? "Sans TVA" : `${t} %`}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 cursor-pointer">
            <Checkbox checked={deduireStock} onCheckedChange={(v) => setDeduireStock(Boolean(v))} className="mt-0.5" />
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Déduire du stock
              <span className="block text-[11px] font-medium text-zinc-400 mt-0.5">Décrémente l&apos;inventaire pour les lignes liées à un produit.</span>
            </span>
          </label>

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-2 text-sm">
            <div className="flex justify-between font-semibold text-zinc-500">
              <span>Sous-total</span>
              <span>{formatCurrency(totals.sousTotal)}</span>
            </div>
            {remise > 0 && (
              <div className="flex justify-between font-semibold text-red-500">
                <span>Remise</span>
                <span>- {formatCurrency(remise)}</span>
              </div>
            )}
            {totals.montantTva > 0 && (
              <div className="flex justify-between font-semibold text-zinc-500">
                <span>TVA ({tauxTva} %)</span>
                <span>{formatCurrency(totals.montantTva)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black pt-1">
              <span>Total</span>
              <span className="text-brand">{formatCurrency(totals.total)}</span>
            </div>
          </div>

          <Button type="submit" variant="brand" disabled={loading} className="w-full h-12 rounded-xl font-black shadow-lg shadow-brand/20">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Créer la facture
          </Button>
        </div>
      </div>
    </form>
  );
}
