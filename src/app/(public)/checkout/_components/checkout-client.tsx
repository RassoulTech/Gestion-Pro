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
import { registerUser, loginPrecheck } from "@/server/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { Loader2, ArrowLeft, CheckCircle2, ShoppingBag, Lock, UserPlus, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSession, signIn } from "next-auth/react";

const checkoutFormSchema = z.object({
  nomClient: z.string().min(1, "Le nom est obligatoire"),
  emailClient: z.string().email("Email invalide"),
  telephoneClient: z.string().min(8, "Le numéro de téléphone est obligatoire"),
  adresseLivraison: z.string().min(3, "L'adresse de livraison est obligatoire"),
  notes: z.string().optional(),
  paymentMethod: z.enum(["WAVE", "ORANGE_MONEY", "PAYPAL", "STRIPE", "CASH_ON_DELIVERY"]),
});

type CheckoutForm = z.infer<typeof checkoutFormSchema>;

export function CheckoutClient() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Auth Tab State
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccessMessage, setRegSuccessMessage] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const isAuthenticated = status === "authenticated";

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

  // Pre-fill form when user logs in
  useEffect(() => {
    if (session?.user) {
      form.setValue("nomClient", session.user.name || "");
      form.setValue("emailClient", session.user.email || "");
    }
  }, [session, form]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError("Veuillez remplir tous les champs.");
      return;
    }
    
    setIsLoggingIn(true);
    setLoginError("");
    try {
      const precheck = await loginPrecheck({ email: loginEmail, password: loginPassword });
      
      if (precheck?.serverError || precheck?.data?.status === "invalid_credentials") {
        setLoginError("Adresse e-mail ou mot de passe incorrect.");
        setIsLoggingIn(false);
        return;
      }
      
      if (precheck?.data?.status === "needs_verification") {
        setLoginError("Votre adresse e-mail n'est pas encore vérifiée. Un nouveau lien d'activation vous a été envoyé.");
        setIsLoggingIn(false);
        return;
      }

      const res = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      });
      
      if (res?.error) {
        setLoginError("Identifiants incorrects ou compte non vérifié.");
      } else {
        toast.success("Connexion réussie !");
        router.refresh();
      }
    } catch (err) {
      setLoginError("Une erreur inattendue est survenue.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || !regConfirm) {
      setRegError("Veuillez remplir tous les champs.");
      return;
    }
    if (regPassword !== regConfirm) {
      setRegError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (regPassword.length < 8) {
      setRegError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    
    setIsRegistering(true);
    setRegError("");
    setRegSuccessMessage("");
    try {
      const res = await registerUser({
        name: regName,
        email: regEmail,
        password: regPassword,
        confirmPassword: regConfirm,
      });
      
      if (res?.serverError) {
        setRegError(res.serverError);
      } else if (res?.data?.success) {
        setRegSuccessMessage(res.data.success);
        toast.success("Compte créé !");
        // switch tab to login so they can log in once verified
        setTimeout(() => {
          setAuthTab("login");
          setLoginEmail(regEmail);
        }, 8000);
      }
    } catch (err) {
      setRegError("Une erreur inattendue est survenue.");
    } finally {
      setIsRegistering(false);
    }
  };

  function onSubmit(data: CheckoutForm) {
    if (!isAuthenticated) {
      toast.error("Vous devez obligatoirement être connecté pour finaliser votre commande.");
      return;
    }
    execute({
      ...data,
      items: items.map(item => ({
        produitId: item.produitId,
        quantite: item.quantite,
        prixUnitaire: item.prixUnitaire,
      })),
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] py-12 lg:py-20 animate-fade-in">
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

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          
          {/* Left panel: Auth Form or Shipping Address Form */}
          <div className="lg:col-span-8 bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-orange-500/5 blur-3xl rounded-full pointer-events-none" />
            
            {!isAuthenticated ? (
              <div className="space-y-6 relative z-10">
                <div className="text-center pb-4">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-3">
                    <Lock className="h-6 w-6 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Connexion Obligatoire</h2>
                  <p className="text-sm font-semibold text-slate-400 mt-1">Vous devez vous connecter ou créer un compte pour commander.</p>
                </div>

                {/* Custom Tabs */}
                <div className="flex bg-slate-50 dark:bg-zinc-850 p-1.5 rounded-2xl border border-slate-100 dark:border-zinc-800 mb-6">
                  <button 
                    onClick={() => { setAuthTab("login"); setLoginError(""); }}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${authTab === "login" ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-md" : "text-slate-400"}`}
                  >
                    <LogIn className="h-4 w-4" />
                    Se connecter
                  </button>
                  <button 
                    onClick={() => { setAuthTab("register"); setRegError(""); }}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${authTab === "register" ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-md" : "text-slate-400"}`}
                  >
                    <UserPlus className="h-4 w-4" />
                    Créer un compte
                  </button>
                </div>

                {/* Login Tab Content */}
                {authTab === "login" && (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {loginError && (
                      <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-xs font-bold text-red-600 leading-relaxed">
                        {loginError}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-wider text-slate-400">Adresse Email</Label>
                      <Input 
                        type="email" 
                        required 
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="exemple@mail.com" 
                        className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none font-bold" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-wider text-slate-400">Mot de Passe</Label>
                      <Input 
                        type="password" 
                        required 
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••" 
                        className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none font-bold" 
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isLoggingIn}
                      className="w-full h-12 rounded-xl font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/15"
                    >
                      {isLoggingIn ? <Loader2 className="h-5 w-5 animate-spin" /> : "Se connecter & continuer"}
                    </Button>
                  </form>
                )}

                {/* Register Tab Content */}
                {authTab === "register" && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    {regError && (
                      <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-xs font-bold text-red-600">
                        {regError}
                      </div>
                    )}
                    {regSuccessMessage && (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl text-xs font-bold text-emerald-600 leading-relaxed flex items-start gap-2.5">
                        <Mail className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-black text-sm">Vérification de l&apos;e-mail requise</p>
                          <p className="mt-1 font-semibold text-zinc-500 dark:text-zinc-400">{regSuccessMessage}</p>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-wider text-slate-400">Nom Complet</Label>
                        <Input 
                          type="text" 
                          required 
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Mohamed Dione" 
                          className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-wider text-slate-400">Adresse Email</Label>
                        <Input 
                          type="email" 
                          required 
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="exemple@mail.com" 
                          className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none font-bold" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-wider text-slate-400">Mot de Passe</Label>
                        <Input 
                          type="password" 
                          required 
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••" 
                          className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-wider text-slate-400">Confirmer</Label>
                        <Input 
                          type="password" 
                          required 
                          value={regConfirm}
                          onChange={(e) => setRegConfirm(e.target.value)}
                          placeholder="••••••••" 
                          className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none font-bold" 
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isRegistering}
                      className="w-full h-12 rounded-xl font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/15"
                    >
                      {isRegistering ? <Loader2 className="h-5 w-5 animate-spin" /> : "Créer mon compte client"}
                    </Button>
                  </form>
                )}
              </div>
            ) : (
              // Connected: Show checkout form
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
                      <Input {...form.register("telephoneClient")} placeholder="77 383 13 64" className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none" />
                      {form.formState.errors.telephoneClient && <p className="text-sm text-red-500">{form.formState.errors.telephoneClient.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Email</Label>
                    <Input {...form.register("emailClient")} type="email" disabled className="h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 border-none text-zinc-400 font-bold cursor-not-allowed" />
                    {form.formState.errors.emailClient && <p className="text-sm text-red-500">{form.formState.errors.emailClient.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Adresse de livraison *</Label>
                    <Textarea {...form.register("adresseLivraison")} placeholder="Votre adresse exacte à Dakar, Thiès, etc." className="rounded-xl bg-slate-50 dark:bg-zinc-800 border-none min-h-[100px]" />
                    {form.formState.errors.adresseLivraison && <p className="text-sm text-red-500">{form.formState.errors.adresseLivraison.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Notes (Optionnel)</Label>
                    <Textarea {...form.register("notes")} placeholder="Instructions particulières..." className="rounded-xl bg-slate-50 dark:bg-zinc-800 border-none" />
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
            )}
          </div>

          {/* Right panel: Summary Sticky Card */}
          <div className="lg:col-span-4 bg-slate-50 dark:bg-zinc-800/50 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-zinc-800 sticky top-28">
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
