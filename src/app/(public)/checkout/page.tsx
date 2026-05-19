"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  ArrowLeft, ShoppingBag, Loader2, ShieldCheck,
  MapPin, Phone, User, MessageSquare, Mail, KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency, cn } from "@/lib/utils";
import { createMarketplaceCommande } from "@/server/actions/marketplace-checkout.actions";

type PaymentMethodType = "WAVE" | "ORANGE_MONEY" | "PAYPAL" | "STRIPE" | "CASH_ON_DELIVERY";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [nomClient, setNomClient] = useState("");
  const [emailClient, setEmailClient] = useState("");
  const [telephoneClient, setTelephoneClient] = useState("");
  const [adresseLivraison, setAdresseLivraison] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("WAVE");
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");

  // Prefill if user is already logged in
  const isLoggedIn = !!session?.user;
  useEffect(() => {
    if (isLoggedIn) {
      if (session?.user?.name && !nomClient) setNomClient(session.user.name);
      if (session?.user?.email && !emailClient) setEmailClient(session.user.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-16 sm:py-24 bg-slate-950 text-white">
        <div className="w-full max-w-xl mx-auto px-4 text-center">
          <div className="relative p-10 sm:p-16 bg-zinc-900 border border-zinc-800 rounded-[3rem] shadow-xl overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 blur-3xl rounded-full pointer-events-none" />
            
            <div className="relative z-10 space-y-6">
              <div className="mx-auto h-24 w-24 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-emerald-400 shadow-inner">
                <ShoppingBag className="h-10 w-10 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Votre panier est vide</h1>
                <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Vous devez ajouter des articles dans votre panier avant de pouvoir finaliser votre commande.
                </p>
              </div>
              <Button asChild variant="brand" className="rounded-2xl px-8 h-13 font-black shadow-lg shadow-emerald-500/20 w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-none">
                <Link href="/marketplace">
                  Explorer le marketplace
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomClient.trim()) {
      toast.error("Veuillez renseigner votre nom complet.");
      return;
    }
    if (!telephoneClient.trim() || telephoneClient.length < 8) {
      toast.error("Veuillez renseigner un numéro de téléphone valide.");
      return;
    }
    if (!adresseLivraison.trim()) {
      toast.error("Veuillez spécifier l'adresse de livraison.");
      return;
    }
    if (createAccount && !isLoggedIn) {
      if (!emailClient.trim()) {
        toast.error("L'email est obligatoire pour créer un compte.");
        return;
      }
      if (password.length < 8) {
        toast.error("Le mot de passe doit contenir au moins 8 caractères.");
        return;
      }
    }

    startTransition(async () => {
      try {
        const result = await createMarketplaceCommande({
          nomClient,
          emailClient: emailClient.trim() || undefined,
          telephoneClient,
          adresseLivraison,
          notes: notes || undefined,
          paymentMethod,
          createAccount: createAccount && !isLoggedIn,
          password: createAccount && !isLoggedIn ? password : undefined,
          items: items.map(item => ({
            produitId: item.produitId,
            quantite: item.quantite,
            prixUnitaire: item.prixUnitaire
          }))
        });

        if (result?.serverError) {
          toast.error(result.serverError);
          return;
        }

        if (result?.data?.success) {
          toast.success("Commande enregistrée avec succès !");

          // Clear cart immediately upon successful action call
          clearCart();

          // If we just created an account for this buyer, sign them in silently
          // so they land on /mes-commandes already authenticated.
          if (result.data.accountCreatedEmail && password) {
            try {
              await signIn("credentials", {
                email: result.data.accountCreatedEmail,
                password,
                redirect: false,
              });
            } catch (signInErr) {
              console.warn("Auto sign-in after account creation failed:", signInErr);
            }
          }

          // Redirect client to payment URL or success screen
          if (result.data.paymentUrl) {
            router.push(result.data.paymentUrl);
          } else {
            toast.error("Une erreur s'est produite lors de la redirection.");
          }
        } else {
          toast.error("Impossible d'enregistrer votre commande. Veuillez réessayer.");
        }
      } catch (err) {
        console.error("Checkout submit error:", err);
        toast.error("Une erreur s'est produite. Veuillez réessayer.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 lg:py-20 font-sans relative overflow-hidden">
      {/* Background visual glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-10">
          <Button asChild variant="ghost" className="rounded-2xl font-bold group mb-6 px-4 py-2 hover:bg-zinc-800/50 hover:text-white">
            <Link href="/panier" className="inline-flex items-center text-zinc-400">
              <ArrowLeft className="mr-2 h-4.5 w-4.5 transition-transform group-hover:-translate-x-1" />
              Retour au panier
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Finaliser l&apos;achat
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base font-semibold">
              Renseignez vos coordonnées et procédez au paiement sécurisé.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 items-start">
          
          {/* LEFT COLUMN: Customer Info Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Card: Delivery Information */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 sm:p-8 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
                
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                  Informations de Livraison
                </h2>

                {/* Connected user info */}
                {isLoggedIn && (
                  <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 px-4 py-3 text-xs font-bold text-emerald-300 flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Connecté en tant que <span className="text-white">{session?.user?.email}</span> — votre commande sera ajoutée à votre historique.
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Name field */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-400" /> Nom complet *
                    </label>
                    <Input
                      type="text"
                      placeholder="Mamadou Diallo"
                      required
                      value={nomClient}
                      onChange={(e) => setNomClient(e.target.value)}
                      className="h-12 rounded-xl bg-zinc-950 border-zinc-800 focus:border-zinc-700 text-white placeholder-zinc-600 font-bold"
                    />
                  </div>

                  {/* Telephone field */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" /> Téléphone *
                    </label>
                    <Input
                      type="tel"
                      placeholder="77 123 45 67"
                      required
                      value={telephoneClient}
                      onChange={(e) => setTelephoneClient(e.target.value)}
                      className="h-12 rounded-xl bg-zinc-950 border-zinc-800 focus:border-zinc-700 text-white placeholder-zinc-600 font-bold"
                    />
                  </div>

                  {/* Email field (new) */}
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-400" /> Email {isLoggedIn ? "" : "(recommandé)"}
                    </label>
                    <Input
                      type="email"
                      placeholder="mamadou@example.com"
                      value={emailClient}
                      onChange={(e) => setEmailClient(e.target.value)}
                      disabled={isLoggedIn}
                      className="h-12 rounded-xl bg-zinc-950 border-zinc-800 focus:border-zinc-700 text-white placeholder-zinc-600 font-bold disabled:opacity-60"
                    />
                  </div>

                  {/* Delivery Address field */}
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Adresse de livraison complète *
                    </label>
                    <Input
                      type="text"
                      placeholder="Dakar Plateau, Rue 12 x Avenue Lamine Gueye"
                      required
                      value={adresseLivraison}
                      onChange={(e) => setAdresseLivraison(e.target.value)}
                      className="h-12 rounded-xl bg-zinc-950 border-zinc-800 focus:border-zinc-700 text-white placeholder-zinc-600 font-bold"
                    />
                  </div>

                  {/* Order Notes field */}
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Notes complémentaires (Facultatif)
                    </label>
                    <Textarea
                      placeholder="Ex: Code d'entrée de l'immeuble, instructions pour le livreur..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[100px] rounded-xl bg-zinc-950 border-zinc-800 focus:border-zinc-700 text-white placeholder-zinc-600 font-bold"
                    />
                  </div>
                </div>

                {/* Create account option (only for non-logged users) */}
                {!isLoggedIn && (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createAccount}
                        onChange={(e) => setCreateAccount(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/30"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-black text-white">Créer un compte pour suivre mes commandes</p>
                        <p className="text-[11px] text-zinc-400 font-semibold mt-0.5">
                          Retrouvez l&apos;historique de vos achats, sauvegardez votre adresse et passez commande plus vite la prochaine fois.
                        </p>
                      </div>
                    </label>

                    {createAccount && (
                      <div className="space-y-2 pl-7">
                        <label className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> Mot de passe (8 caractères minimum)
                        </label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          minLength={8}
                          className="h-12 rounded-xl bg-zinc-950 border-zinc-800 focus:border-zinc-700 text-white placeholder-zinc-600 font-bold"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card: Payment method Selection */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 sm:p-8 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />

                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />
                  Méthode de Paiement
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Wave option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("WAVE")}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden active:scale-98 group",
                      paymentMethod === "WAVE" 
                        ? "bg-sky-500/10 border-sky-400 shadow-md shadow-sky-500/5" 
                        : "bg-zinc-950 border-zinc-800/80 hover:border-zinc-700"
                    )}
                  >
                    <div className="h-10 w-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black text-base shrink-0 shadow-inner">
                      🐧
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                        Wave Mobile
                        <span className="inline-block text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 uppercase">Populaire</span>
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Orange, Tigo, Expresso (Côte d&apos;Ivoire, Sénégal...)</p>
                    </div>
                  </button>

                  {/* Orange money option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("ORANGE_MONEY")}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden active:scale-98 group",
                      paymentMethod === "ORANGE_MONEY" 
                        ? "bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/5" 
                        : "bg-zinc-950 border-zinc-800/80 hover:border-zinc-700"
                    )}
                  >
                    <div className="h-10 w-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-base shrink-0 shadow-inner">
                      🍊
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white">Orange Money</h4>
                      <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Règlement mobile sécurisé et instantané</p>
                    </div>
                  </button>

                  {/* Stripe option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("STRIPE")}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden active:scale-98 group",
                      paymentMethod === "STRIPE" 
                        ? "bg-emerald-500/10 border-emerald-400 shadow-md shadow-emerald-500/5" 
                        : "bg-zinc-950 border-zinc-800/80 hover:border-zinc-700"
                    )}
                  >
                    <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-base shrink-0 shadow-inner">
                      💳
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white">Carte Bancaire</h4>
                      <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Visa, MasterCard sécurisés par Stripe</p>
                    </div>
                  </button>

                  {/* Paypal option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("PAYPAL")}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden active:scale-98 group",
                      paymentMethod === "PAYPAL" 
                        ? "bg-blue-500/10 border-blue-400 shadow-md shadow-blue-500/5" 
                        : "bg-zinc-950 border-zinc-800/80 hover:border-zinc-700"
                    )}
                  >
                    <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base shrink-0 shadow-inner">
                      🅿️
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white">PayPal</h4>
                      <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Paiement international en devises</p>
                    </div>
                  </button>

                  {/* Cash on delivery option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden active:scale-98 sm:col-span-2 group",
                      paymentMethod === "CASH_ON_DELIVERY" 
                        ? "bg-blue-500/10 border-blue-400 shadow-md shadow-blue-500/5" 
                        : "bg-zinc-950 border-zinc-800/80 hover:border-zinc-700"
                    )}
                  >
                    <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base shrink-0 shadow-inner">
                      🚚
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white">Paiement à la Livraison (Cash)</h4>
                      <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Réglez en espèces directement auprès du livreur lors de la réception</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-15 rounded-2xl font-black text-base shadow-xl shadow-emerald-500/10 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-none text-white active:scale-98 transition duration-200"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enregistrement de votre commande...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-5 w-5" />
                    Confirmer et payer {formatCurrency(totalPrice)}
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* RIGHT COLUMN: Order Summary Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 sm:p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />
            
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-blue-400" /> Résumé de votre Panier
            </h3>

            {/* Items List */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.produitId} className="flex gap-4 items-center bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                  <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0 relative overflow-hidden">
                    {item.photo ? (
                      <Image src={item.photo} alt={item.nom} fill className="object-cover" unoptimized />
                    ) : (
                      "📦"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-xs text-zinc-200 truncate">{item.nom}</h4>
                    <p className="text-[10px] text-zinc-500 font-bold mt-0.5 truncate uppercase tracking-wider">{item.boutiqueNom}</p>
                    <p className="text-[10px] text-emerald-400 font-black mt-0.5">{item.quantite}x {formatCurrency(item.prixUnitaire)}</p>
                  </div>
                  <span className="font-black text-xs text-zinc-200">{formatCurrency(item.prixUnitaire * item.quantite)}</span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="border-t border-zinc-800 pt-6 space-y-3.5">
              <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                <span>Nombre d&apos;articles :</span>
                <span className="text-zinc-200">{totalItems}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                <span>Frais de livraison :</span>
                <span className="text-emerald-400 font-black uppercase tracking-widest text-[9px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/10 rounded-full">Gratuit</span>
              </div>
              <div className="border-t border-zinc-850 pt-4 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-zinc-500 block uppercase tracking-wider">Total à payer</span>
                  <span className="text-[10px] text-zinc-500">Taxes incluses (FCFA)</span>
                </div>
                <span className="text-2xl font-black text-emerald-400 tracking-tight">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>

            {/* Safe Purchase Info */}
            <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-850 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1">
                <h5 className="font-black text-[10px] text-zinc-300 uppercase tracking-wider">Achat 100% Sécurisé</h5>
                <p className="text-[9px] leading-relaxed text-zinc-500 font-bold">
                  Vos transactions sont traitées de manière chiffrée via nos passerelles de paiement partenaires Wave, Orange Money et Stripe.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
