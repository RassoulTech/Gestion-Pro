"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

import { ajusterStockManuellement } from "@/server/actions/stock.actions";
import { ajusterStockSchema, type AjusterStockInput } from "@/schemas/stock.schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AjustementStockModal({
  boutiqueId,
  produits,
}: {
  boutiqueId: string;
  produits: { id: string; nom: string; code: string; quantite: number }[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const { execute, isExecuting } = useAction(ajusterStockManuellement, {
    onSuccess: () => {
      toast.success("Stock ajusté avec succès");
      setOpen(false);
      form.reset();
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erreur lors de l'ajustement du stock");
    },
  });

  const form = useForm<AjusterStockInput>({
    resolver: zodResolver(ajusterStockSchema),
    defaultValues: {
      type: "ENTREE",
      quantite: 1,
      raison: "",
    },
  });

  function onSubmit(data: AjusterStockInput) {
    execute({ boutiqueId, data });
  }

  const watchType = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl h-14 px-6 font-bold gap-2">
          <Plus className="h-5 w-5" />
          Nouvel Ajustement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Ajuster le stock</DialogTitle>
          <DialogDescription>Ajoutez ou retirez manuellement du stock pour un produit.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label className="font-bold">Produit</Label>
            <Select onValueChange={(val) => form.setValue("produitId", val)}>
              <SelectTrigger className="h-12 rounded-xl bg-zinc-50 border-none">
                <SelectValue placeholder="Sélectionnez un produit" />
              </SelectTrigger>
              <SelectContent>
                {produits.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nom} (Stock: {p.quantite})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.produitId && (
              <p className="text-sm text-red-500 font-medium">{form.formState.errors.produitId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              className={`h-20 rounded-xl flex flex-col gap-2 border-2 ${
                watchType === "ENTREE" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-transparent bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
              }`}
              onClick={() => form.setValue("type", "ENTREE")}
            >
              <ArrowDownToLine className="h-6 w-6" />
              <span className="font-bold">Entrée</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className={`h-20 rounded-xl flex flex-col gap-2 border-2 ${
                watchType === "SORTIE" ? "border-rose-500 bg-rose-50 text-rose-700" : "border-transparent bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
              }`}
              onClick={() => form.setValue("type", "SORTIE")}
            >
              <ArrowUpFromLine className="h-6 w-6" />
              <span className="font-bold">Sortie</span>
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="font-bold">Quantité</Label>
            <Input
              type="number"
              min={1}
              {...form.register("quantite")}
              className="h-12 rounded-xl bg-zinc-50 border-none text-lg font-black"
            />
            {form.formState.errors.quantite && (
              <p className="text-sm text-red-500 font-medium">{form.formState.errors.quantite.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-bold">Raison (Casse, Livraison, Inventaire...)</Label>
            <Textarea
              {...form.register("raison")}
              className="rounded-xl bg-zinc-50 border-none resize-none font-medium"
              placeholder="Ex: Réception de la commande fournisseur..."
            />
            {form.formState.errors.raison && (
              <p className="text-sm text-red-500 font-medium">{form.formState.errors.raison.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isExecuting} className="w-full h-12 rounded-xl font-bold text-lg">
            {isExecuting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Confirmer l'ajustement
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
