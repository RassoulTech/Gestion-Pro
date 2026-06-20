"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { useCart } from "@/hooks/use-cart";
import { createMarketplaceCommande } from "@/server/actions/marketplace-checkout.actions";
import { registerUser } from "@/server/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { Loader2, ArrowLeft, CheckCircle2, ShoppingBag, LogIn, UserCheck } from "lucide-react";
import Link from "next/link";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSession } from "next-auth/react";

// Indicatifs courants (Afrique de l'Ouest / Centrale + quelques internationaux).
const INDICATIFS = [
  { code: "+221", label: "🇸🇳 Sénégal (+221)" },
  { code: "+225", label: "🇨🇮 Côte d'Ivoire (+225)" },
  { code: "+223", label: "🇲🇱 Mali (+223)" },
  { code: "+226", label: "🇧🇫 Burkina Faso (+226)" },
  { code: "+224", label: "🇬🇳 Guinée (+224)" },
  { code: "+227", label: "🇳🇪 Niger (+227)" },
  { code: "+228", label: "🇹🇬 Togo (+228)" },
  { code: "+229", label: "🇧🇯 Bénin (+229)" },
  { code: "+237", label: "🇨🇲 Cameroun (+237)" },
  { code: "+233", label: "🇬🇭 Ghana (+233)" },
  { code: "+234", label: "🇳🇬 Nigeria (+234)" },
  { code: "+33", label: "🇫🇷 France (+33)" },
  { code: "+1", label: "🇺🇸 USA/Canada (+1)" },
];

const checkoutFormSchema = z
  .object({
    prenomClient: z.string().min(1, "Le prénom est obligatoire"),
    nomClient: z.string().min(1, "Le nom est obligatoire"),
    emailClient: z.string().email("Email invalide"),
    indicatif: z.string().min(2, "Indicatif requis"),
    telephoneLocal: z
      .string()
      .min(6, "Numéro trop court")
      .regex(/^[0-9\s().-]+$/, "Chiffres uniquement"),
    adresseLivraison: z.string().min(3, "L'adresse est obligatoire"),
    ville: z.string().min(1, "La ville est obligatoire"),
    pays: z.string().min(1, "Le pays est obligatoire"),
    notes: z.string().optional(),
    paymentMethod: z.enum(["WAVE", "ORANGE_MONEY", "CASH_ON_DELIVERY"]),
    createAccount: z.boolean().optional(),
    accountPassword: z.string().optional(),
  })
  .refine(
    (d) => !d.createAccount || (d.accountPassword?.length ?? 0) >= 8,
    {
      message: "Mot de passe d'au moins 8 caractères requis pour créer le compte",
      path: ["accountPassword"],
    }
  );

type CheckoutForm = z.infer<typeof checkoutFormSchema>;

export function CheckoutClient() {
  const { items, hydrated, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    // On attend l'hydratation du panier avant de juger qu'il est vide.
    if (hydrated && items.length === 0) {
      router.push("/panier");
    }
  }, [hydrated, items, router]);

  const { execute, isExecuting } = useAction(createMarketplaceCommande, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        clearCart();
        toast.success("Commande validée avec succès !");
        if (data.paymentUrl) {
          if (data.paymentUrl.startsWith("http://") || data.paymentUrl.startsWith("https://")) {
            window.location.href = data.paymentUrl;
          } else {
            router.push(data.paymentUrl);
          }
        } else {
          router.push("/checkout/success");
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
      prenomClient: "",
      nomClient: "",
      emailClient: "",
      indicatif: "+221",
      telephoneLocal: "",
      adresseLivraison: "",
      ville: "",
      pays: "Sénégal",
      notes: "",
      paymentMethod: "CASH_ON_DELIVERY",
      createAccount: false,
      accountPassword: "",
    },
  });

  const wantsAccount = form.watch("createAccount");

  // Pré-remplissage pratique si l'utilisateur est déjà connecté (non obligatoire).
  useEffect(() => {
    if (session?.user) {
      const name = (session.user.name || "").trim();
      if (name && !form.getValues("prenomClient")) {
        const [prenom, ...rest] = name.split(" ");
        form.setValue("prenomClient", prenom || "");
        if (rest.length) form.setValue("nomClient", rest.join(" "));
      }
      if (session.user.email && !form.getValues("emailClient")) {
        form.setValue("emailClient", session.user.email);
      }
    }
  }, [session, form]);

  async function onSubmit(data: CheckoutForm) {
    // Création de compte facultative : best-effort, ne bloque jamais la commande.
    if (data.createAccount && data.accountPassword) {
      setRegistering(true);
      try {
        const res = await registerUser({
          name: `${data.prenomClient} ${data.nomClient}`.trim(),
          email: data.emailClient,
          password: data.accountPassword,
          confirmPassword: data.accountPassword,
        });
        if (res?.data?.success) {
          toast.success("Compte créé — un email d'activation vous a été envoyé.");
        } else if (res?.serverError) {
          toast.message(`Commande maintenue (compte non créé : ${res.serverError})`);
        }
      } catch {
        /* non bloquant : on poursuit la commande en mode invité */
      } finally {
        setRegistering(false);
      }
    }

    const telephoneClient = `${data.indicatif}${data.telephoneLocal.replace(/\D/g, "")}`;
    execute({
      nomClient: data.nomClient,
      prenomClient: data.prenomClient,
      emailClient: data.emailClient,
      telephoneClient,
      adresseLivraison: data.adresseLivraison,
      ville: data.ville,
      pays: data.pays,
      notes: data.notes,
      paymentMethod: data.paymentMethod,
      items: items.map((item) => ({
        produitId: item.produitId,
        quantite: item.quantite,
        prixUnitaire: item.prixUnitaire,
      })),
    });
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0a0a0a]">
        <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
      </div>
    );
  }
  if (items.length === 0) return null;

  const busy = isExecuting || registering;
  const fieldClass =
    "h-12 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none font-medium focus-visible:ring-2 focus-visible:ring-orange-500/40";
  const errClass = "text-xs font-semibold text-red-500 mt-1";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-24 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Button asChild variant="ghost" className="rounded-2xl font-bold group mb-6 px-4 py-2">
          <Link href="/panier" className="inline-flex items-center">
            <ArrowLeft className="mr-2 h-4.5 w-4.5 transition-transform group-hover:-translate-x-1" />
            Retour au panier
          </Link>
        </Button>

        <h1 className="text-fluid-h1 sm:text-fluid-display font-black tracking-tight text-slate-900 dark:text-white mb-3">
          Finaliser la commande
        </h1>
        <p className="text-fluid-body font-semibold text-slate-400 mb-8">
          Pas besoin de compte — commandez en quelques secondes.
        </p>

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Formulaire */}
          <div className="lg:col-span-8 bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-orange-500/5 blur-3xl rounded-full pointer-events-none" />

            {/* Bandeau optionnel : connexion (ne bloque jamais la commande) */}
            {isAuthenticated ? (
              <div className="relative z-10 mb-6 flex items-center gap-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-4 py-3">
                <UserCheck className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Connecté en tant que {session?.user?.email}
                </p>
              </div>
            ) : (
              <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 px-4 py-3">
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                  Déjà client ? Connectez-vous pour aller plus vite (facultatif).
                </p>
                <Link
                  href="/login?callbackUrl=/checkout"
                  className="inline-flex items-center gap-1.5 text-xs font-black text-orange-600 hover:underline underline-offset-4"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Se connecter
                </Link>
              </div>
            )}

            <form
              onSubmit={form.handleSubmit(onSubmit, () =>
                toast.error("Veuillez corriger les champs en rouge.")
              )}
              className="space-y-6 relative z-10"
              noValidate
            >
              <div className="space-y-4">
                <h2 className="text-xl font-bold border-b border-slate-100 dark:border-zinc-800 pb-2">
                  Vos informations
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bold text-sm">Prénom *</Label>
                    <Input {...form.register("prenomClient")} placeholder="Mohamed" className={`mt-1.5 ${fieldClass}`} />
                    {form.formState.errors.prenomClient && (
                      <p className={errClass}>{form.formState.errors.prenomClient.message}</p>
                    )}
                  </div>
                  <div>
                    <Label className="font-bold text-sm">Nom *</Label>
                    <Input {...form.register("nomClient")} placeholder="Dione" className={`mt-1.5 ${fieldClass}`} />
                    {form.formState.errors.nomClient && (
                      <p className={errClass}>{form.formState.errors.nomClient.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="font-bold text-sm">Email *</Label>
                  <Input
                    {...form.register("emailClient")}
                    type="email"
                    inputMode="email"
                    placeholder="exemple@mail.com"
                    className={`mt-1.5 ${fieldClass}`}
                  />
                  <p className="text-[11px] font-medium text-slate-400 mt-1">
                    Votre facture détaillée sera envoyée à cette adresse.
                  </p>
                  {form.formState.errors.emailClient && (
                    <p className={errClass}>{form.formState.errors.emailClient.message}</p>
                  )}
                </div>

                <div>
                  <Label className="font-bold text-sm">Téléphone *</Label>
                  <div className="mt-1.5 flex gap-2">
                    <select
                      {...form.register("indicatif")}
                      className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none font-semibold text-sm px-3 shrink-0 max-w-[8.5rem] focus-visible:ring-2 focus-visible:ring-orange-500/40 outline-none"
                      aria-label="Indicatif pays"
                    >
                      {INDICATIFS.map((i) => (
                        <option key={i.code} value={i.code}>
                          {i.label}
                        </option>
                      ))}
                    </select>
                    <Input
                      {...form.register("telephoneLocal")}
                      type="tel"
                      inputMode="tel"
                      placeholder="77 123 45 67"
                      className={`flex-1 ${fieldClass}`}
                    />
                  </div>
                  {form.formState.errors.telephoneLocal && (
                    <p className={errClass}>{form.formState.errors.telephoneLocal.message}</p>
                  )}
                </div>

                <div>
                  <Label className="font-bold text-sm">Adresse de livraison *</Label>
                  <Textarea
                    {...form.register("adresseLivraison")}
                    placeholder="Quartier, rue, repère…"
                    className="mt-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none min-h-[88px] focus-visible:ring-2 focus-visible:ring-orange-500/40"
                  />
                  {form.formState.errors.adresseLivraison && (
                    <p className={errClass}>{form.formState.errors.adresseLivraison.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bold text-sm">Ville *</Label>
                    <Input {...form.register("ville")} placeholder="Dakar" className={`mt-1.5 ${fieldClass}`} />
                    {form.formState.errors.ville && (
                      <p className={errClass}>{form.formState.errors.ville.message}</p>
                    )}
                  </div>
                  <div>
                    <Label className="font-bold text-sm">Pays *</Label>
                    <Input {...form.register("pays")} placeholder="Sénégal" className={`mt-1.5 ${fieldClass}`} />
                    {form.formState.errors.pays && (
                      <p className={errClass}>{form.formState.errors.pays.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="font-bold text-sm">Commentaire (facultatif)</Label>
                  <Textarea
                    {...form.register("notes")}
                    placeholder="Instructions particulières de livraison…"
                    className="mt-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
                  />
                </div>
              </div>

              {/* Création de compte facultative (masquée si déjà connecté) */}
              {!isAuthenticated && (
                <div className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 p-4 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...form.register("createAccount")}
                      className="mt-1 h-4 w-4 rounded accent-orange-600 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-slate-700 dark:text-zinc-200">
                      Créer un compte pour suivre mes commandes
                      <span className="block text-[11px] font-medium text-slate-400">
                        Facultatif — n&apos;interrompt pas votre achat.
                      </span>
                    </span>
                  </label>
                  {wantsAccount && (
                    <div>
                      <Input
                        {...form.register("accountPassword")}
                        type="password"
                        placeholder="Mot de passe (8 caractères min.)"
                        className={fieldClass}
                      />
                      {form.formState.errors.accountPassword && (
                        <p className={errClass}>{form.formState.errors.accountPassword.message}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4 pt-2">
                <h2 className="text-xl font-bold border-b border-slate-100 dark:border-zinc-800 pb-2">Paiement</h2>
                <RadioGroup
                  defaultValue="CASH_ON_DELIVERY"
                  onValueChange={(val: string) =>
                    form.setValue("paymentMethod", val as CheckoutForm["paymentMethod"])
                  }
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <Label className="h-14 flex items-center gap-3 px-4 rounded-xl border-2 border-slate-100 dark:border-zinc-800 cursor-pointer hover:border-orange-500 transition-colors [&:has(:checked)]:border-orange-500 [&:has(:checked)]:bg-orange-50 dark:[&:has(:checked)]:bg-orange-500/10 shrink-0">
                    <RadioGroupItem value="CASH_ON_DELIVERY" id="cod" />
                    <span className="font-bold text-sm">Paiement à la livraison</span>
                  </Label>
                  <Label className="h-14 flex items-center gap-3 px-4 rounded-xl border-2 border-slate-100 dark:border-zinc-800 cursor-pointer hover:border-orange-500 transition-colors [&:has(:checked)]:border-orange-500 [&:has(:checked)]:bg-orange-50 dark:[&:has(:checked)]:bg-orange-500/10 shrink-0">
                    <RadioGroupItem value="WAVE" id="wave" />
                    <span className="font-bold text-sm">Wave</span>
                  </Label>
                  <Label className="h-14 flex items-center gap-3 px-4 rounded-xl border-2 border-slate-100 dark:border-zinc-800 cursor-pointer hover:border-orange-500 transition-colors [&:has(:checked)]:border-orange-500 [&:has(:checked)]:bg-orange-50 dark:[&:has(:checked)]:bg-orange-500/10 shrink-0">
                    <RadioGroupItem value="ORANGE_MONEY" id="om" />
                    <span className="font-bold text-sm">Orange Money</span>
                  </Label>
                </RadioGroup>
                <p className="text-[11px] font-medium text-slate-400">
                  Wave et Orange Money sont traités via PayTech (paiement sécurisé).
                </p>
              </div>

              <Button
                type="submit"
                disabled={busy}
                className="w-full h-14 rounded-2xl font-black text-lg bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-500/20 flex items-center justify-center shrink-0"
              >
                {busy ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-6 w-6" />
                )}
                Confirmer & Payer {formatCurrency(totalPrice)}
              </Button>
            </form>
          </div>

          {/* Résumé */}
          <div className="lg:col-span-4 bg-slate-50 dark:bg-zinc-800/50 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-zinc-800 lg:sticky lg:top-28">
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
                <span className="font-black text-2xl text-orange-600 dark:text-orange-400">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
