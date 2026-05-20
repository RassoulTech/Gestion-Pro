/* eslint-disable @typescript-eslint/no-unused-vars */
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
 
import { ArrowLeft, Store, Package, Sparkles, Phone, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { AddToCartButton } from "./_components/add-to-cart-button";

type Props = {
  params: Promise<{ slug: string; id: string }>;
};

export default async function ProduitPublicPage({ params }: Props) {
  const { slug, id } = await params;

  // SECURITY: First resolve slug to boutique, then scope product query by boutiqueId
  const boutique = await prisma.boutique.findFirst({
    where: { slug, statut: "ACTIF" },
    select: { id: true, nom: true, slug: true, telephone: true },
  });

  if (!boutique) notFound();

  const produit = await prisma.produit.findFirst({
    where: { id, boutiqueId: boutique.id },
    include: { categorie: true },
  });

  if (!produit) notFound();

  const cleanPhone = boutique.telephone ? boutique.telephone.replace(/\s+/g, "") : "";
  
  // Standard contact whatsapp message
  const whatsappUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Bonjour, je suis intéressé par le produit *${produit.nom}* (${formatCurrency(produit.prixUnitaire)}) dans votre boutique *${boutique.nom}*. Est-il disponible ?`
      )}`
    : "#";

  // Requirement 3: Floating WhatsApp button with specific text format
  const whatsappUrlFlottant = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Bonjour, je suis intéressé par ce produit : ${produit.nom}`
      )}`
    : "#";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] py-12 sm:py-20 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Back Link */}
        <div>
          <Button asChild variant="ghost" className="rounded-2xl font-bold group hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-4 py-2">
            <Link href={`/s/${slug}`}>
              <ArrowLeft className="mr-2 h-4.5 w-4.5 transition-transform group-hover:-translate-x-1 text-slate-400" />
              Retour à {boutique.nom}
            </Link>
          </Button>
        </div>

        {/* Main Product Container */}
        <div className="grid gap-12 lg:grid-cols-2 items-start">
          
          {/* Product Image Section with ambient color glow */}
          <div className="relative group w-full">
            {/* Ambient background glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-orange-600 opacity-20 blur-3xl rounded-[2.5rem] group-hover:opacity-30 transition-all duration-700 pointer-events-none" />
            
            <div className="relative aspect-square w-full rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 flex items-center justify-center overflow-hidden shadow-xl">
              {produit.photo ? (
                <Image
                  src={produit.photo}
                  alt={produit.nom}
                  fill
                  className="object-cover transition-transform duration-750 group-hover:scale-105"
                  unoptimized
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-300 dark:text-zinc-700 space-y-3">
                  <Package className="h-24 w-24 stroke-[1.25]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Aucun visuel disponible</span>
                </div>
              )}
              
              <div className="absolute top-6 left-6">
                <Badge className="rounded-full px-4 py-1.5 bg-orange-500 text-white font-extrabold text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/20 border-none">
                  {produit.categorie?.nom || "Produit"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Product Info Section */}
          <div className="flex flex-col space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                {produit.nom}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-3xl font-black text-orange-600 dark:text-orange-400 tracking-tight">
                  {formatCurrency(produit.prixUnitaire)}
                </p>
                
                {produit.quantite > 0 ? (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">En stock</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Indisponible</span>
                  </div>
                )}
              </div>
              
              <p className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800/80 px-3 py-1 rounded-md w-fit font-bold">
                RÉFÉRENCE : {produit.code || "NON RENSEIGNÉE"}
              </p>
            </div>

            <Separator className="bg-slate-100 dark:bg-zinc-800/80" />

            {/* Product description card */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-[2rem] p-7 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Description du produit</h3>
              <div className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
                {produit.description ? (
                  <p className="whitespace-pre-line">{produit.description}</p>
                ) : (
                  <p className="italic text-slate-400">
                    Aucune description détaillée n&apos;a été fournie pour ce produit. Contactez la boutique directement pour plus d&apos;informations.
                  </p>
                )}
              </div>
            </div>

            {/* Call to Actions Section */}
            <div className="bg-white/80 dark:bg-zinc-900/80 border border-slate-100 dark:border-zinc-800/80 rounded-[2.5rem] p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-24 h-24 bg-orange-500/5 blur-2xl rounded-full" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100">
                    Passer commande
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Cart Action */}
                  <AddToCartButton
                    produit={{ id: produit.id, nom: produit.nom, prixUnitaire: produit.prixUnitaire, photo: produit.photo }}
                    boutiqueSlug={slug}
                    boutiqueNom={boutique.nom}
                    disabled={produit.quantite <= 0}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* WhatsApp Action */}
                    {boutique.telephone && (
                      <Button asChild size="lg" className="h-14 rounded-2xl font-black text-sm bg-[#25D366] hover:bg-[#20ba5a] text-white border-none shadow-lg shadow-emerald-500/10 hover:-translate-y-0.5 transition-all">
                        <a href={whatsappUrlFlottant} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="mr-2 h-5 w-5 fill-white" />
                          Discuter sur WhatsApp
                        </a>
                      </Button>
                    )}

                    {/* Direct Call Action */}
                    {boutique.telephone && (
                      <Button asChild size="lg" variant="outline" className="h-14 rounded-2xl font-black text-sm border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:-translate-y-0.5 transition-all">
                        <a href={`tel:${cleanPhone}`}>
                          <Phone className="mr-2 h-5 w-5 text-slate-500" />
                          Appeler directement
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-center text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                  Paiement sécurisé et direct avec le commerçant
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Requirement 3: Floating WhatsApp FAB fixed in the bottom right corner */}
      {boutique.telephone && (
        <div className="fixed bottom-6 right-6 z-50 animate-pulse hover:animate-none">
          <a
            href={whatsappUrlFlottant}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center h-16 w-16 rounded-full bg-[#25D366] text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group relative border-4 border-white dark:border-zinc-900"
            title="Commander via WhatsApp"
          >
            <span className="absolute right-20 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
              Commander via WhatsApp
            </span>
            <MessageCircle className="h-7 w-7 fill-white" />
          </a>
        </div>
      )}
    </div>
  );
}
