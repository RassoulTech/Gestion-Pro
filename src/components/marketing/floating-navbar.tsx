"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Menu, Package, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/marketing/theme-toggle";
import { CartBadge } from "@/components/marketing/cart-badge";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

const navLinks: Array<{ href: string; label: string }> = [
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/#pour-qui", label: "Pour qui" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/marketplace", label: "Marketplace" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function FloatingNavbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
        className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
      >
        <nav
          aria-label="Navigation principale"
          className={cn(
            "flex w-full max-w-5xl items-center gap-4 rounded-full border transition-all duration-500 ease-out px-4 py-2",
            scrolled
              ? "bg-background/40 backdrop-blur-2xl border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_rgba(0,0,0,0.3)] scale-[0.98]"
              : "bg-transparent border-transparent"
          )}
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 group"
            aria-label="Accueil GestionPro"
          >
            <BrandLogo
              size={36}
              className="shadow-lg shadow-brand/20 group-hover:rotate-6 transition-transform rounded-xl"
            />
            <span className="hidden sm:block text-base font-bold tracking-tight text-foreground">
              GestionPro
            </span>
          </Link>

          {/* Nav Links Desktop */}
          <div className="hidden flex-1 items-center justify-center md:flex">
            <ul className="flex items-center gap-1 rounded-full bg-foreground/5 p-1 backdrop-blur-md">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="relative whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:text-foreground group"
                  >
                    {l.label}
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-brand rounded-full transition-all group-hover:w-4" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions Desktop */}
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <ThemeToggle className="h-9 w-9 rounded-xl" />
            <CartBadge className="h-9 w-9 rounded-xl" />
            {isLoggedIn ? (
              <>
                <Button asChild variant="ghost" className="h-9 rounded-xl font-medium gap-1.5">
                  <Link href="/mes-commandes">
                    <Package className="h-4 w-4" />
                    Mes commandes
                  </Link>
                </Button>
                <Button asChild variant="brand" className="h-9 rounded-xl px-5 font-semibold shadow-lg shadow-brand/10 hover:shadow-brand/20 active-press">
                  <Link href="/boutiques">
                    Mon espace
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="h-9 rounded-xl font-medium">
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button
                  asChild
                  variant="brand"
                  className="h-9 rounded-xl px-5 font-semibold shadow-lg shadow-brand/10 hover:shadow-brand/20 active-press"
                >
                  <Link href="/register">
                    Essai gratuit
                    <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile UI */}
          <div className="ml-auto flex items-center gap-2 md:hidden">
            <CartBadge />
            <ThemeToggle className="h-9 w-9 rounded-xl" />
            <button
              onClick={() => setOpen(!open)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-foreground/5 text-foreground"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-md md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed inset-x-4 top-20 z-50 overflow-hidden rounded-3xl border border-white/10 bg-card p-6 shadow-2xl md:hidden"
            >
              <ul className="space-y-2">
                {navLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-4 py-3 text-lg font-semibold text-foreground hover:bg-foreground/5"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
                {isLoggedIn && (
                  <li>
                    <Link
                      href="/mes-commandes"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-4 py-3 text-lg font-semibold text-foreground hover:bg-foreground/5"
                    >
                      <Package className="h-4 w-4" />
                      Mes commandes
                    </Link>
                  </li>
                )}
              </ul>
              <div className="mt-6 grid grid-cols-2 gap-3 pt-6 border-t border-white/5">
                {isLoggedIn ? (
                  <Button asChild variant="brand" size="lg" className="rounded-2xl h-12 col-span-2">
                    <Link href="/boutiques" onClick={() => setOpen(false)}>Mon espace</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" size="lg" className="rounded-2xl h-12">
                      <Link href="/login" onClick={() => setOpen(false)}>Connexion</Link>
                    </Button>
                    <Button asChild variant="brand" size="lg" className="rounded-2xl h-12">
                      <Link href="/register" onClick={() => setOpen(false)}>S&apos;inscrire</Link>
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
