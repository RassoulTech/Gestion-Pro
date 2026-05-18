/* eslint-disable @typescript-eslint/no-unused-vars */
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Store, ArrowRight, Sparkles, CheckCircle2, Package, MapPin } from "lucide-react";
import { getPublicBoutiques } from "@/server/queries/boutique.queries";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { MarketplaceFilters } from "./_components/marketplace-filters";
import { SimplePagination } from "@/components/ui/simple-pagination";

export const metadata = { title: "Marketplace Public — GestionPro" };

function BoutiqueCardSkeleton() {
  return (
    <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-80 rounded-[2.5rem] bg-slate-100 dark:bg-zinc-800" />
      ))}
    </div>
  );
}

async function BoutiqueGrid({
  search,
  secteur,
  page,
}: {
  search?: string;
  secteur?: string;
  page?: number;
}) {
  const { data: boutiques, total, page: currentPage } = await getPublicBoutiques({
    search,
    secteur: secteur === "all" ? undefined : (secteur as never),
    page,
    perPage: 20,
  });

  if (boutiques.length === 0) {
    return (
      <div className="py-20 bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 rounded-[3rem] shadow-sm">
        <EmptyState
          icon={Store}
          title="Aucun commerce trouvé"
          description="Ajustez vos filtres de recherche ou sélectionnez un autre secteur d'activité."
        />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {boutiques.map((boutique) => (
          <Link key={boutique.id} href={`/s/${boutique.slug}`} className="group flex">
            <div className="w-full relative flex flex-col p-7 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-2xl hover:border-blue-500/30 hover:-translate-y-2.5 transition-all duration-500 ease-out overflow-hidden">
              {/* Decorative premium hover glow */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-gradient-to-br from-[#2563EB]/10 to-[#7C3AED]/10 blur-3xl rounded-full group-hover:scale-175 transition-transform duration-700 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                
                {/* Card Header */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/50 flex items-center justify-center shrink-0 overflow-hidden relative shadow-inner group-hover:scale-105 transition-transform duration-300">
                    {boutique.logo || boutique.vendeur?.photo ? (
                      <Image
                        src={(boutique.logo || boutique.vendeur?.photo)!}
                        alt={boutique.nom}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <Store className="h-7 w-7 text-blue-500" />
                    )}
                  </div>
                  
                  <Badge className="rounded-full px-3.5 py-1 bg-slate-50 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 font-bold border border-slate-100 dark:border-zinc-800 text-[10px] uppercase tracking-wider">
                    {boutique.secteurActivite || "Boutique"}
                  </Badge>
                </div>

                {/* Card Main Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100 truncate group-hover:text-blue-500 transition-colors">
                      {boutique.nom}
                    </h3>
                    <CheckCircle2 className="w-4.5 h-4.5 text-blue-500 shrink-0 fill-blue-500/10" />
                  </div>
                  {boutique.adresse && (
                    <div className="flex items-center gap-1 text-slate-400 dark:text-zinc-500 text-xs">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{boutique.adresse}</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-3 leading-relaxed min-h-[3rem] pt-1">
                    {boutique.description || "Découvrez nos produits exceptionnels et bénéficiez d'un service client de premier ordre."}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="mt-8 pt-5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                      <Package className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-xs font-black text-slate-700 dark:text-zinc-300">
                      {boutique._count.produits} produits
                    </span>
                  </div>
                  
                  <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest flex items-center gap-1 transition-all group-hover:gap-2">
                    Visiter
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

              </div>
            </div>
          </Link>
        ))}
      </div>

      <SimplePagination
        totalItems={total}
        itemsPerPage={20}
        currentPage={currentPage}
      />
    </div>
  );
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; secteur?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16 sm:space-y-24">
        
        {/* Giant premium Hero Header */}
        <div className="max-w-3xl mx-auto text-center space-y-6 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 text-xs font-extrabold text-blue-500 uppercase tracking-widest relative z-10 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            Marketplace Public
          </div>
          
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1] relative z-10">
            Explorez notre <br />
            <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">Marketplace.</span>
          </h1>
          
          <p className="text-base sm:text-lg text-slate-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed relative z-10 font-medium">
            Trouvez les meilleurs commerçants près de chez vous, découvrez leurs catalogues exclusifs et commandez en toute simplicité.
          </p>
        </div>

        {/* Search and interactive category pills section */}
        <div className="space-y-12">
          <MarketplaceFilters />
          
          {/* Main Boutiques Grid list */}
          <Suspense fallback={<BoutiqueCardSkeleton />}>
            <BoutiqueGrid search={params.search} secteur={params.secteur} page={page} />
          </Suspense>
        </div>

      </div>
    </div>
  );
}
