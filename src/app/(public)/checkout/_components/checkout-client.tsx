"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { useCart } from "@/hooks/use-cart";
import { createMarketplaceCommande } from "@/server/actions/marketplace-checkout.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { Loader2, ArrowLeft, CheckCircle2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const checkoutFormSchema = z.object({
  nomClient: z.string().min(1, "Le nom est obligatoire"),
  emailClient: z.string().email("Email invalide").optional().or(z.literal("").transform(() => undefined)),
  telephoneClient: z.string().min(8, "Le numéro de téléphone est obligatoire"),
  adresseLivraison: z.string().min(3, "L'adresse de livraison est obligatoire"),
  notes: z.string().optional(),
  paymentMethod: z.enum(["WAVE", "ORANGE_MONEY", "PAYPAL", "STRIPE", "CASH_ON_DELIVERY"]),
});

type CheckoutForm = z.infer<typeof checkoutFormSchema>;

export function CheckoutClient() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (items.length === 0) {
      router.push("/panier");
    }
  }, [items, router]);

  const { execute, isExecuting } = useAction(createMarketplaceCommande, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        clearCart();
        toast.success("Commande validée avec succès !");
        if (data.paymentUrl) {
          router.push(data.paymentUrl);
        } else {
          router.push("/mes-commandes");
        }
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erreur lors de la validation de la commande");
    },
  });

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      nomClient: "",
      emailClient: "",
      telephoneClient: "",
      adresseLivraison: "",
      notes: "",
      paymentMethod: "CASH_ON_DELIVERY",
    },
  });

  function onSubmit(data: CheckoutForm) {
    execute({
      ...data,
      items: items.map(item => ({
        produitId: item.produitId,
        quantite: item.quantite,
        prixUnitaire: item.prixUnitaire,
      })),
      createAccount: false,
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Button asChild variant="ghost" className="rounded-2xl font-bold group mb-6 px-4 py-2">
          <Link href="/panier" className="inline-flex items-center">
            <ArrowLeft className="mr-2 h-4.5 w-4.5 transition-transform group-hover:-translate-x-1" />
            Retour au panier
          </Link>
        </Button>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-10">
          Finaliser la commande
        </h1>

        <div className="grid gap-8 lg:grid-cols-2 items-start">
          <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-orange-500/5 blur-3xl rounded-full pointer-events-none" />
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-10">
              <div className="space-y-4">
                <h2 className="text-xl font-bold border-b border-slate-100 dark:border-zinc-800 pb-2">Mes Informations</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Nom complet *</Label>
                    <Input {...form.register("nomClient")} className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none" />
                    {form.formState.errors.nomClient && <p className="text-sm text-red-500">{form.formState.errors.nomClient.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Téléphone *</Label>
                    <Input {...form.register("telephoneClient")} className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none" />
                    {form.formState.errors.telephoneClient && <p className="text-sm text-red-500">{form.formState.errors.telephoneClient.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold">Email (Optionnel)</Label>
                  <Input {...form.register("emailClient")} type="email" className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none" />
                  {form.formState.errors.emailClient && <p className="text-sm text-red-500">{form.formState.errors.emailClient.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="font-bold">Adresse de livraison *</Label>
                  <Textarea {...form.register("adresseLivraison")} className="rounded-xl bg-slate-50 dark:bg-zinc-800 border-none min-h-[100px]" />
                  {form.formState.errors.adresseLivraison && <p className="text-sm text-red-500">{form.formState.errors.adresseLivraison.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="font-bold">Notes (Optionnel)</Label>
                  <Textarea {...form.register("notes")} placeholder="Instructions de livraison..." className="rounded-xl bg-slate-50 dark:bg-zinc-800 border-none" />
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <h2 className="text-xl font-bold border-b border-slate-100 dark:border-zinc-800 pb-2">Paiement</h2>
                <RadioGroup 
                  defaultValue="CASH_ON_DELIVERY" 
                  onValueChange={(val: string) => form.setValue("paymentMethod", val as any)}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <Label className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 dark:border-zinc-800 cursor-pointer hover:border-orange-500 transition-colors [&:has(:checked)]:border-orange-500 [&:has(:checked)]:bg-orange-50 dark:[&:has(:checked)]:bg-orange-500/10">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="CASH_ON_DELIVERY" id="cod" />
                      <span className="font-bold">Paiement à la livraison</span>
                    </div>
                  </Label>
                  <Label className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 dark:border-zinc-800 cursor-pointer hover:border-orange-500 transition-colors [&:has(:checked)]:border-orange-500 [&:has(:checked)]:bg-orange-50 dark:[&:has(:checked)]:bg-orange-500/10">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="WAVE" id="wave" />
                      <span className="font-bold">Wave</span>
                    </div>
                  </Label>
                  <Label className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 dark:border-zinc-800 cursor-pointer hover:border-orange-500 transition-colors [&:has(:checked)]:border-orange-500 [&:has(:checked)]:bg-orange-50 dark:[&:has(:checked)]:bg-orange-500/10">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="ORANGE_MONEY" id="om" />
                      <span className="font-bold">Orange Money</span>
                    </div>
                  </Label>
                  <Label className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 dark:border-zinc-800 cursor-pointer hover:border-orange-500 transition-colors [&:has(:checked)]:border-orange-500 [&:has(:checked)]:bg-orange-50 dark:[&:has(:checked)]:bg-orange-500/10">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="STRIPE" id="card" />
                      <span className="font-bold">Carte Bancaire</span>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              <Button
                type="submit"
                disabled={isExecuting}
                className="w-full h-14 rounded-2xl font-black text-lg bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-500/20"
              >
                {isExecuting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <CheckCircle2 className="mr-2 h-6 w-6" />}
                Confirmer & Payer {formatCurrency(totalPrice)}
              </Button>
            </form>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-zinc-800 sticky top-28">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-orange-500" />
              Résumé
            </h2>
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
              {items.map((item) => (
                <div key={item.produitId} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-800 dark:text-zinc-200">{item.nom}</span>
                    <span className="text-xs text-slate-500 font-medium">{item.boutiqueNom}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-black">{formatCurrency(item.prixUnitaire * item.quantite)}</span>
                    <span className="text-xs text-slate-400 font-bold">Qté: {item.quantite}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-slate-200 dark:border-zinc-700 mt-6 pt-6">
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-slate-500">Total à payer</span>
                <span className="font-black text-2xl text-orange-600 dark:text-orange-400">{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
