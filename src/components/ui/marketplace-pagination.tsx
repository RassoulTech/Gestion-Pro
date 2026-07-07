"use client";

import React, { useState, useEffect, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface MarketplacePaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
}

function getPageRange(currentPage: number, totalPages: number) {
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    if (currentPage > 4) {
      pages.push("...");
    }

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 4) {
      start = 2;
      end = 5;
    } else if (currentPage >= totalPages - 3) {
      start = totalPages - 4;
      end = totalPages - 1;
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 3) {
      pages.push("...");
    }

    pages.push(totalPages);
  }
  return pages;
}

export function MarketplacePagination({
  totalItems,
  itemsPerPage,
  currentPage,
}: MarketplacePaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const [goToPage, setGoToPage] = useState(String(currentPage));

  useEffect(() => {
    setGoToPage(String(currentPage));
  }, [currentPage]);

  if (totalItems === 0) return null;

  const handlePageChange = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(pageNumber));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handlePerPageChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("perPage", value);
    params.set("page", "1"); // reset to first page to avoid out of bounds
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleGoToSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(goToPage, 10);
    if (pageNum >= 1 && pageNum <= totalPages) {
      handlePageChange(pageNum);
    } else {
      setGoToPage(String(currentPage));
    }
  };

  const pageRange = getPageRange(currentPage, totalPages);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-8 border border-zinc-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xl backdrop-blur-xl rounded-2xl sm:rounded-[2rem] mt-8 sm:mt-12">
      {/* Première ligne : Informations de pagination + Taille de page + Aller à la page */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="text-sm font-bold text-zinc-500 dark:text-zinc-400 text-center lg:text-left">
          Affichage de :{" "}
          <span className="font-extrabold text-zinc-900 dark:text-white">
            {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
          </span>
          –
          <span className="font-extrabold text-zinc-900 dark:text-white">
            {Math.min(currentPage * itemsPerPage, totalItems)}
          </span>{" "}
          sur{" "}
          <span className="font-extrabold text-orange-500">{totalItems.toLocaleString("fr-FR")}</span>{" "}
          {totalItems > 1 ? "produits" : "produit"}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {/* Produits par page */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
              Produits par page :
            </span>
            <Select value={String(itemsPerPage)} onValueChange={handlePerPageChange}>
              <SelectTrigger className="h-9 w-20 rounded-xl font-bold bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-orange-500">
                <SelectValue placeholder="20" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="40">40</SelectItem>
                <SelectItem value="60">60</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Aller à la page */}
          {totalPages > 1 && (
            <form onSubmit={handleGoToSubmit} className="flex items-center gap-2">
              <label
                htmlFor="go-to-page"
                className="text-xs font-bold text-zinc-500 dark:text-zinc-400 whitespace-nowrap"
              >
                Aller à la page :
              </label>
              <Input
                id="go-to-page"
                type="number"
                inputMode="numeric"
                min={1}
                max={totalPages}
                value={goToPage}
                onChange={(e) => setGoToPage(e.target.value)}
                className="h-9 w-16 text-center rounded-xl font-extrabold bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 px-1 focus-visible:ring-orange-500 focus-visible:ring-offset-0"
              />
              <Button
                type="submit"
                size="sm"
                className="h-9 px-3.5 rounded-xl font-extrabold bg-brand hover:bg-brand/90 text-white shadow-md shadow-brand/10 transition-all duration-300 transform active:scale-95 shrink-0"
              >
                Aller
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Deuxième ligne : Contrôles de page (Desktop / Mobile) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center">
          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center gap-1.5">
            <Button
              variant="outline"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-10 px-4 rounded-xl font-extrabold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft className="h-4 w-4 mr-1.5" />
              Précédent
            </Button>

            {pageRange.map((page, index) => {
              if (page === "...") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="w-10 text-center text-zinc-400 dark:text-zinc-500 font-extrabold select-none"
                  >
                    ...
                  </span>
                );
              }

              const pageNum = page as number;
              const isActive = currentPage === pageNum;

              return (
                <Button
                  key={`page-${pageNum}`}
                  variant={isActive ? "default" : "outline"}
                  onClick={() => handlePageChange(pageNum)}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`Page ${pageNum}`}
                  className={cn(
                    "h-10 w-10 p-0 rounded-xl font-extrabold transition-all duration-300 transform active:scale-95",
                    isActive
                      ? "bg-brand hover:bg-brand/90 text-white border-transparent shadow-lg shadow-brand/25 scale-105"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  )}
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-10 px-4 rounded-xl font-extrabold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>

          {/* Navigation Mobile Compacte */}
          <div className="flex md:hidden items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-10 px-3 rounded-xl font-extrabold border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 disabled:opacity-40 disabled:hover:bg-white text-zinc-700 dark:text-zinc-300"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>

            <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">
              Page {currentPage} sur {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-10 px-3 rounded-xl font-extrabold border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 disabled:opacity-40 disabled:hover:bg-white text-zinc-700 dark:text-zinc-300"
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
