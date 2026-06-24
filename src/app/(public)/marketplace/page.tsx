import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Sparkles, PackageSearch } from "lucide-react";
import {
  getMarketplaceProducts,
  getMarketplaceFilterOptions,
  type MarketplaceSort,
  type MarketplaceDispo,
} from "@/server/queries/marketplace.queries";
import type { SecteurActivite } from "@prisma/client";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { MarketplaceFilters } from "./_components/marketplace-filters";
import { MarketplaceProductCard } from "./_components/marketplace-product-card";
import { MarketplacePagination } from "@/components/ui/marketplace-pagination";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketplace");
  return { title: t("metaTitle") };
}

function ProductGridSkeleton() {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 min-[370px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-80 rounded-2xl sm:rounded-[2rem] bg-slate-100 dark:bg-zinc-800" />
      ))}
    </div>
  );
}

function toNumber(value?: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

async function ProductGrid({
  search,
  secteur,
  categorie,
  boutiqueSlug,
  prixMin,
  prixMax,
  dispo,
  sort,
  page,
  perPage,
}: {
  search?: string;
  secteur?: string;
  categorie?: string;
  boutiqueSlug?: string;
  prixMin?: string;
  prixMax?: string;
  dispo?: string;
  sort?: string;
  page: number;
  perPage: number;
}) {
  const { data, total, page: currentPage } = await getMarketplaceProducts({
    search,
    secteur: secteur && secteur !== "all" ? (secteur as SecteurActivite) : undefined,
    categorie: categorie && categorie !== "all" ? categorie : undefined,
    boutiqueSlug: boutiqueSlug && boutiqueSlug !== "all" ? boutiqueSlug : undefined,
    prixMin: toNumber(prixMin),
    prixMax: toNumber(prixMax),
    dispo: dispo === "stock" || dispo === "rupture" ? (dispo as MarketplaceDispo) : undefined,
    sort: (sort as MarketplaceSort) || "recent",
    page,
    perPage,
  });

  if (data.length === 0) {
    const t = await getTranslations("marketplace");
    return (
      <div className="py-20 bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm">
        <EmptyState
          icon={PackageSearch}
          title={t("emptyTitle")}
          description={t("emptyDesc")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:gap-6 grid-cols-1 min-[370px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {data.map((produit) => (
          <MarketplaceProductCard key={produit.id} produit={produit} />
        ))}
      </div>

      <MarketplacePagination totalItems={total} itemsPerPage={perPage} currentPage={currentPage} />
    </div>
  );
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = params.page ? Math.max(1, parseInt(params.page, 10) || 1) : 1;
  
  let perPage = 20;
  if (params.perPage === "40") perPage = 40;
  if (params.perPage === "60") perPage = 60;

  const { categories, boutiques } = await getMarketplaceFilterOptions();
  const t = await getTranslations("marketplace");

  // Clé qui force le re-render du Suspense quand un filtre change
  const suspenseKey = JSON.stringify(params);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] pt-24 pb-10 sm:pb-12 lg:pt-28 lg:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-12">
        {/* Hero orienté produits */}
        <div className="max-w-3xl mx-auto text-center space-y-4 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,350px)] h-[350px] bg-gradient-to-r from-orange-500/10 to-orange-500/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 border border-orange-500/20 px-3.5 py-1 text-xs font-extrabold text-orange-500 uppercase tracking-widest relative z-10">
            <Sparkles className="w-3.5 h-3.5" />
            {t("eyebrow")}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15] relative z-10">
            {t("titleLead")} <br />
            <span className="bg-gradient-to-r from-[#EA580C] to-orange-500 bg-clip-text text-transparent">{t("titleHighlight")}</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed relative z-10 font-medium">
            {t("subtitle")}
          </p>
        </div>

        {/* Filtres */}
        <MarketplaceFilters categories={categories} boutiques={boutiques} />

        {/* Grille produits */}
        <Suspense key={suspenseKey} fallback={<ProductGridSkeleton />}>
          <ProductGrid
            search={params.search}
            secteur={params.secteur}
            categorie={params.categorie}
            boutiqueSlug={params.boutique}
            prixMin={params.prixMin}
            prixMax={params.prixMax}
            dispo={params.dispo}
            sort={params.sort}
            page={page}
            perPage={perPage}
          />
        </Suspense>
      </div>
    </div>
  );
}
