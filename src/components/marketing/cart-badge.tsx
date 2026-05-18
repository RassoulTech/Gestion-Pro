"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

export function CartBadge({ className }: { className?: string }) {
  const [mounted, setMounted] = React.useState(false);
  const { totalItems } = useCart();

  React.useEffect(() => setMounted(true), []);

  return (
    <Link
      href="/panier"
      aria-label="Panier"
      className={cn(
        "active-press relative inline-flex h-9 w-9 items-center justify-center rounded-md",
        "border border-border bg-background text-muted-foreground",
        "transition-colors duration-150 ease-out hover:bg-accent hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      <ShoppingCart className="h-4 w-4" strokeWidth={1.5} />
      {mounted && totalItems > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand text-[9px] font-black text-white leading-none">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  );
}
