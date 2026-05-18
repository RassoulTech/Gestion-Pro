"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface SimplePaginationProps {
  totalItems: number;
  itemsPerPage?: number;
  currentPage: number;
  onPageChange?: (page: number) => void;
}

export function SimplePagination({
  totalItems,
  itemsPerPage = 20,
  currentPage,
  onPageChange,
}: SimplePaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const handlePageClick = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-5 px-6 border border-slate-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-3xl mt-8">
      <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-zinc-400 text-center sm:text-left">
        Affichage de{" "}
        <span className="font-extrabold text-slate-900 dark:text-white">
          {(currentPage - 1) * itemsPerPage + 1}
        </span>{" "}
        à{" "}
        <span className="font-extrabold text-slate-900 dark:text-white">
          {Math.min(currentPage * itemsPerPage, totalItems)}
        </span>{" "}
        sur{" "}
        <span className="font-extrabold text-slate-900 dark:text-white">{totalItems}</span>{" "}
        éléments
      </p>

      <div className="flex items-center justify-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageClick(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="h-10 w-10 rounded-xl font-bold border-slate-200 dark:border-zinc-800 disabled:opacity-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((page) => {
            return (
              page === 1 ||
              page === totalPages ||
              Math.abs(page - currentPage) <= 1
            );
          })
          .map((page, index, array) => {
            const prevPage = array[index - 1];
            const showEllipsis = index > 0 && prevPage !== undefined && page - prevPage > 1;

            return (
              <React.Fragment key={page}>
                {showEllipsis && (
                  <span className="text-slate-400 dark:text-zinc-500 px-1 font-bold text-xs select-none">
                    ...
                  </span>
                )}
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  onClick={() => handlePageClick(page)}
                  className={`h-10 w-10 p-0 text-xs rounded-xl font-extrabold border-slate-200 dark:border-zinc-800 ${
                    currentPage === page
                      ? "bg-brand hover:bg-brand/90 text-white border-transparent"
                      : "hover:bg-zinc-100/50"
                  }`}
                >
                  {page}
                </Button>
              </React.Fragment>
            );
          })}

        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageClick(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="h-10 w-10 rounded-xl font-bold border-slate-200 dark:border-zinc-800 disabled:opacity-50"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
