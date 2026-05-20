import Link from "next/link";
import { Check, Sparkles, ShoppingBag, MapPin, Phone, User, Calendar, CreditCard, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CheckoutSuccessPageProps {
  searchParams: Promise<{
    ids?: string;
    method?: string;
  }>;
}

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const params = await searchParams;
  const ids = params.ids || "";
  const method = params.method || "cod";

  const orderIds = ids.split(",").filter(Boolean);

  // Fetch orders from DB with lines and products
  const orders = await prisma.commandeClient.findMany({
    where: { id: { in: orderIds } },
    include: {
      client: true,
      boutique: true,
      lignes: {
        include: {
          produit: true,
        },
      },
    },
  });

  const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);
  const clientInfo = orders[0]?.client;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans py-12 px-4 relative overflow-hidden flex flex-col items-center">
      {/* Background radial glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Confetti effect simulation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
        <div className="absolute top-10 left-[10%] w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
        <div className="absolute top-32 right-[20%] w-3 h-3 bg-orange-400 rounded-full animate-bounce" />
        <div className="absolute bottom-40 left-[15%] w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse" />
        <div className="absolute bottom-20 right-[15%] w-3 h-3 bg-orange-400 rounded-full animate-ping" />
      </div>

      <div className="w-full max-w-2xl relative z-10 space-y-8 mt-6">
        {/* Top Success Badge */}
        <div className="text-center space-y-4">
          <div className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20 transform hover:scale-105 transition duration-300">
            <Check className="h-10 w-10" strokeWidth={3.5} />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> Achat Confirmé !
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white">Merci pour votre confiance !</h1>
            <p className="text-zinc-400 text-sm max-w-md mx-auto">
              Votre commande a été enregistrée avec succès. Les marchands ont été notifiés de vos achats.
            </p>
          </div>
        </div>

        {/* Client Info Summary Card */}
        {clientInfo && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Coordonnées de livraison</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-800/80">
                <User className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Destinataire</p>
                  <p className="text-sm font-black text-zinc-200">{clientInfo.nom}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-800/80">
                <Phone className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Téléphone</p>
                  <p className="text-sm font-black text-zinc-200">{clientInfo.telephone || "Non fourni"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-800/80 sm:col-span-2">
                <MapPin className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Adresse de Livraison</p>
                  <p className="text-sm font-black text-zinc-200 leading-relaxed">{clientInfo.adresse || "Non fournie"}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Orders Summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Détails de la commande ({orders.length} boutique{orders.length > 1 ? "s" : ""})</h3>
            <span className="text-xs font-bold text-zinc-400">Total : {formatCurrency(totalAmount)}</span>
          </div>

          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-zinc-950/60 p-5 rounded-[1.5rem] border border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                  <div>
                    <p className="text-xs font-black text-white">{order.boutique.nom}</p>
                    <p className="text-[10px] text-zinc-500 font-bold font-mono mt-0.5">{order.code}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 text-[10px] font-black uppercase tracking-wider">
                    {order.statutPaiement === "CONFIRME" ? "Payé" : "À la livraison"}
                  </span>
                </div>

                <div className="space-y-3">
                  {order.lignes.map((line) => (
                    <div key={line.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400">
                          {line.quantite}x
                        </div>
                        <div>
                          <p className="font-bold text-zinc-300">{line.produit.nom}</p>
                          <p className="text-[10px] text-zinc-500">{formatCurrency(line.prixUnitaire)} / unité</p>
                        </div>
                      </div>
                      <span className="font-black text-zinc-200">{formatCurrency(line.prixUnitaire * line.quantite)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-zinc-850 text-xs">
                  <span className="font-bold text-zinc-500">Sous-total :</span>
                  <span className="font-black text-emerald-400">{formatCurrency(order.total)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-emerald-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Moyen de règlement</p>
                <p className="text-xs font-black text-zinc-300">
                  {method === "stripe" ? "Carte Bancaire (Stripe)" :
                   method === "paydunya" ? "Mobile Money (PayDunya)" :
                   method === "wave" ? "Wave Mobile Money" :
                   method === "orange_money" ? "Orange Money" :
                   method === "paypal" ? "Compte PayPal" : "Paiement à la livraison (Cash)"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 font-bold uppercase">Total global réglé</p>
              <p className="text-xl font-black text-emerald-400">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/" className="w-full sm:w-auto">
            <Button
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black shadow-lg shadow-emerald-500/20 border-none transition-transform duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="h-5 w-5" />
              Retourner à l&apos;accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
