"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("common");
  const tn = useTranslations("nav");

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label={open ? t("close") : t("openMenu")}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile menu overlay */}
      <div
        className={cn(
          "absolute inset-x-0 top-16 z-50 border-b border-border bg-background shadow-lg transition-all duration-200",
          open ? "block" : "hidden"
        )}
      >
        <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
          <Link
            href="/marketplace"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {tn("marketplace")}
          </Link>
          <Link
            href="#tarifs"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {tn("pricing")}
          </Link>
          <div className="my-2 border-t border-border" />
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {t("login")}
          </Link>
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("register")}
          </Link>
        </nav>
      </div>
    </div>
  );
}
