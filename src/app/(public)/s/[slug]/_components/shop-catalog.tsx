"use client";

import { useMemo, useState } from "react";
import { Search, PackageOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { WhatsAppIcon } from "@/components/icons/brand-icons";
import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";
import { getShopWhatsAppLink } from "@/lib/whatsapp";

const PAGE_SIZE = 12;

interface ProduitItem {
  id: string;
  nom: string;
  description?: string | null;
  prixUnitaire: number;
  quantite: number;
  photo: string | null;
  categorieId: string | null;
  categorie: { nom: string } | null;
}
interface CategoryItem { id: string; nom: string }

export function ShopCatalog({
  produits,
  categories,
  boutiqueSlug,
  boutiqueNom,
  whatsapp,
  telephone,
}: {
  produits: ProduitItem[];
  categories: CategoryItem[];
  boutiqueSlug: string;
  boutiqueNom: string;
  whatsapp: string | null;
  telephone: string | null;
}) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Catégories réellement peuplées + "non classés" si besoin.
  const chips = useMemo(() => {
    const withCount = categories
      .map((c) => ({ ...c, count: produits.filter((p) => p.categorieId === c.id).length }))
      .filter((c) => c.count > 0);
    const uncat = produits.filter((p) => !p.categorieId).length;
    return { withCount, uncat };
  }, [categories, produits]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return produits.filter((p) => {
      if (cat === "uncat" && p.categorieId) return false;
      if (cat !== "all" && cat !== "uncat" && p.categorieId !== cat) return false;
      if (q && !p.nom.toLowerCase().includes(q) && !(p.description ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [produits, search, cat]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function changeFilter(next: string) {
    setCat(next);
    setPage(1);
  }
  function changeSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  const waUrl = getShopWhatsAppLink(whatsapp || telephone, boutiqueNom);

  return (
    <div className="space-y-6">
      {/* Search + categories (sticky) */}
      <div className="sticky top-2 z-20 space-y-3 rounded-[1.5rem] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-3 sm:p-4 border border-slate-100 dark:border-zinc-800 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            placeholder="Rechercher un produit…"
            className="h-12 rounded-2xl border-slate-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 pl-11 font-semibold text-sm"
          />
        </div>

        {(chips.withCount.length > 0 || chips.uncat > 0) && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Chip active={cat === "all"} onClick={() => changeFilter("all")} label={`Tout (${produits.length})`} />
            {chips.withCount.map((c) => (
              <Chip key={c.id} active={cat === c.id} onClick={() => changeFilter(c.id)} label={`${c.nom} (${c.count})`} />
            ))}
            {chips.uncat > 0 && (
              <Chip active={cat === "uncat"} onClick={() => changeFilter("uncat")} label={`Autres (${chips.uncat})`} />
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      {pageItems.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
            <PackageOpen className="h-7 w-7" />
          </div>
          <p className="font-extrabold text-slate-700 dark:text-zinc-200">Aucun produit trouvé</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Essayez une autre recherche ou catégorie.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 min-[370px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {pageItems.map((p) => (
            <ProductCard
              key={p.id}
              produit={p}
              boutiqueSlug={boutiqueSlug}
              boutiqueNom={boutiqueNom}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="h-10 w-10 rounded-xl border border-slate-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center text-slate-600 dark:text-zinc-300 disabled:opacity-40"
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-4 h-10 inline-flex items-center rounded-xl bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 text-xs font-black text-slate-600 dark:text-zinc-300">
            Page {safePage} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="h-10 w-10 rounded-xl border border-slate-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center text-slate-600 dark:text-zinc-300 disabled:opacity-40"
            aria-label="Page suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Floating WhatsApp CTA */}
      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-4 sm:right-6 z-40 inline-flex items-center gap-2 rounded-full bg-[#25D366] text-white pl-3 pr-4 sm:pl-4 sm:pr-5 py-3.5 font-black text-sm shadow-2xl shadow-[#25D366]/30 hover:scale-105 active:scale-95 transition-transform"
          aria-label="Contacter sur WhatsApp"
        >
          <WhatsAppIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Commander sur WhatsApp</span>
          <span className="sm:hidden">WhatsApp</span>
        </a>
      )}
    </div>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 px-4 h-9 rounded-full text-xs font-black whitespace-nowrap border transition-colors",
        active
          ? "bg-orange-500 text-white border-orange-500"
          : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-150 dark:border-zinc-800 hover:border-orange-300"
      )}
    >
      {label}
    </button>
  );
}
