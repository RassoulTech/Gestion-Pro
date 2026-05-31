import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Store, MapPin, Phone, Globe, ArrowLeft, CheckCircle2 } from "lucide-react";
import { getBoutiqueBySlug } from "@/server/queries/boutique.queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./_components/product-card";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const boutique = await getBoutiqueBySlug(slug);
  if (!boutique) return { title: "Boutique introuvable" };
  return {
    title: `${boutique.nom} — Boutique Officielle`,
    description: boutique.description ?? `Découvrez la boutique ${boutique.nom} sur GestionPro`,
  };
}

export default async function BoutiquePubliquePage({ params }: Props) {
  const { slug } = await params;
  const boutique = await getBoutiqueBySlug(slug);

  if (!boutique) notFound();

  const categoriesWithProducts = boutique.categories.map((cat) => ({
    ...cat,
    produits: boutique.produits.filter((p) => p.categorieId === cat.id),
  }));
  const uncategorized = boutique.produits.filter((p) => !p.categorieId);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] py-8 sm:py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-12">
        
        {/* Back to Marketplace */}
        <div>
          <Button asChild variant="ghost" className="rounded-xl font-bold group hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400">
            <Link href="/marketplace">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1 text-slate-400" />
              Retour au marketplace
            </Link>
          </Button>
        </div>

        {/* Boutique Header */}
        <div className="relative p-5 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl">
          {/* Subtle colored ambient glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />
          
          {/* Dynamic Smart Banner: ambient background glow derived entirely from the shop logo */}
          {(boutique.logo || boutique.vendeur?.photo) && (
            <div className="absolute inset-0 select-none pointer-events-none overflow-hidden">
              <Image 
                src={(boutique.logo || boutique.vendeur?.photo)!} 
                alt="" 
                fill 
                className="object-cover scale-150 blur-3xl opacity-[0.18] dark:opacity-[0.25] transition-opacity duration-700" 
                sizes="100vw"
                unoptimized 
              />
            </div>
          )}

          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
            
            <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/50 text-orange-500 shadow-md overflow-hidden relative shrink-0">
              {boutique.logo || boutique.vendeur?.photo ? (
                <Image 
                  src={(boutique.logo || boutique.vendeur?.photo)!} 
                  alt={boutique.nom} 
                  fill 
                  className="object-cover" 
                  sizes="96px"
                  unoptimized 
                />
              ) : (
                <Store className="h-12 w-12" />
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                  {boutique.nom}
                  <CheckCircle2 className="w-5 h-5 text-orange-500 fill-orange-500/10 shrink-0" />
                </h1>
                
                <Badge className="rounded-full px-3 py-0.5 bg-orange-500 text-white font-extrabold text-[10px] uppercase tracking-widest border-none">
                  {boutique.secteurActivite || "Boutique"}
                </Badge>
              </div>

              {boutique.description && (
                <p className="max-w-3xl text-sm text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                  {boutique.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-slate-400 dark:text-zinc-500">
                {boutique.adresse && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-orange-500" /> {boutique.adresse}
                  </span>
                )}
                {boutique.telephone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-orange-500" /> {boutique.telephone}
                  </span>
                )}
                {boutique.siteWeb && (
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-orange-500" /> {boutique.siteWeb}
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Products Sections */}
        <div className="space-y-20 pt-8">
          {categoriesWithProducts.map(
            (cat) =>
              cat.produits.length > 0 && (
                <section key={cat.id} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    <h2 className="text-sm font-black tracking-wider text-slate-400 dark:text-zinc-500 uppercase">{cat.nom}</h2>
                    <div className="flex-1 h-px bg-slate-100 dark:bg-zinc-800/80" />
                  </div>
                  
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {cat.produits.map((produit) => (
                      <ProductCard
                        key={produit.id}
                        produit={produit}
                        boutiqueSlug={slug}
                        boutiqueNom={boutique.nom}
                      />
                    ))}
                  </div>
                </section>
              )
          )}

          {uncategorized.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                <h2 className="text-sm font-black tracking-wider text-slate-400 dark:text-zinc-500 uppercase">Autres produits</h2>
                <div className="flex-1 h-px bg-slate-100 dark:bg-zinc-800/80" />
              </div>
              
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {uncategorized.map((produit) => (
                  <ProductCard
                    key={produit.id}
                    produit={{ ...produit, categorie: null }}
                    boutiqueSlug={slug}
                    boutiqueNom={boutique.nom}
                  />
                ))}
              </div>
            </section>
          )}

          {boutique.produits.length === 0 && (
            <div className="py-24 bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 rounded-[2.5rem] text-center space-y-4 shadow-sm">
              <div className="h-16 w-16 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                <Store className="w-8 h-8 text-slate-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 dark:text-zinc-200">Catalogue vide</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Cette boutique n&apos;a pas encore publié d&apos;articles en vente.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
