"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Store,
  Menu,
  X,
  Tag,
  Users,
  Truck,
  Zap,
  Wallet,
  Users2,
  Settings,
  Sun,
  Moon,
  User,
  LogOut,
  Lock,
  CreditCard,
  Calculator,
  QrCode,
  Megaphone,
  Plus,
  Layers,
  FileText,
} from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useBoutique } from "@/components/layouts/boutique-provider";

type PlanCode = "STARTER" | "PRO" | "ENTERPRISE";

type NavItem = {
  /** Clé de traduction sous `sidebar.items.*`. */
  labelKey: string;
  href: string;
  icon: React.ElementType;
  requires?: PlanCode;
  external?: boolean;
};

type BottomNavItem = NavItem;

type QuickAction = {
  /** Clé de traduction sous `bottomNav.quick.*`. */
  labelKey: string;
  href: string;
  icon: React.ElementType;
  color: string;
};

const PLAN_RANK: Record<PlanCode, number> = {
  STARTER: 0,
  PRO: 1,
  ENTERPRISE: 2,
};

function isLocked(item: NavItem, currentPlan?: PlanCode): boolean {
  if (!item.requires || !currentPlan) return false;
  return PLAN_RANK[currentPlan] < PLAN_RANK[item.requires];
}

function getBottomNavItems(boutiqueId?: string, isAdmin?: boolean): BottomNavItem[] {
  if (isAdmin) {
    return [
      { labelKey: "dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { labelKey: "sellers", href: "/admin/vendeurs", icon: Users },
      { labelKey: "shops", href: "/admin/boutiques", icon: Store },
      { labelKey: "plans", href: "/admin/plans", icon: Tag },
    ];
  }
  if (!boutiqueId) {
    return [{ labelKey: "myShops", href: "/boutiques", icon: Store }];
  }
  const base = `/boutiques/${boutiqueId}`;
  return [
    { labelKey: "dashboard", href: base, icon: LayoutDashboard },
    { labelKey: "orders", href: `${base}/commandes`, icon: ShoppingCart },
    { labelKey: "products", href: `${base}/produits`, icon: Package },
    { labelKey: "stock", href: `${base}/stock`, icon: Layers, requires: "PRO" },
  ];
}

function getQuickActions(boutiqueId?: string): QuickAction[] {
  if (!boutiqueId) return [];
  const base = `/boutiques/${boutiqueId}`;
  return [
    { labelKey: "newOrder", href: `${base}/commandes/new`, icon: ShoppingCart, color: "bg-brand text-white" },
    { labelKey: "addProduct", href: `${base}/produits/new`, icon: Package, color: "bg-emerald-500 text-white" },
    { labelKey: "addClient", href: `${base}/clients/new`, icon: Users, color: "bg-blue-500 text-white" },
    { labelKey: "addExpense", href: `${base}/depenses/new`, icon: Wallet, color: "bg-rose-500 text-white" },
  ];
}

function getMoreMenuItems(boutiqueId?: string, isAdmin?: boolean, boutiqueSlug?: string): NavItem[] {
  if (isAdmin) {
    return [
      { labelKey: "users", href: "/admin/utilisateurs", icon: User },
      { labelKey: "subscriptions", href: "/admin/abonnements", icon: Wallet },
      { labelKey: "revenue", href: "/admin/revenus", icon: BarChart3 },
      { labelKey: "logs", href: "/admin/logs", icon: FileText },
    ];
  }
  if (!boutiqueId) return [];
  const base = `/boutiques/${boutiqueId}`;
  return [
    // Gestion commerciale (rest)
    { labelKey: "clients", href: `${base}/clients`, icon: Users },
    { labelKey: "categories", href: `${base}/categories`, icon: Tag },
    { labelKey: "pos", href: `${base}/pos`, icon: Calculator, requires: "PRO" },
    { labelKey: "flashSales", href: `${base}/ventes-flash`, icon: Zap, requires: "PRO" },
    // Fournisseurs
    { labelKey: "suppliers", href: `${base}/fournisseurs`, icon: Truck },
    // Gestion financière
    { labelKey: "invoices", href: `${base}/factures`, icon: FileText, requires: "PRO" },
    { labelKey: "expenses", href: `${base}/depenses`, icon: Wallet },
    { labelKey: "supplierPurchases", href: `${base}/commandes-fournisseur`, icon: Truck },
    { labelKey: "reports", href: `${base}/rapports`, icon: BarChart3, requires: "PRO" },
    // Marketing & Visibilité
    {
      labelKey: "myShop",
      href: boutiqueSlug ? `/s/${boutiqueSlug}` : `${base}/parametres?tab=boutique`,
      icon: Store,
      external: !!boutiqueSlug,
    },
    { labelKey: "qrcode", href: `${base}/qrcode`, icon: QrCode },
    { labelKey: "marketplace", href: "/marketplace", icon: Megaphone, external: true },
    // Compte
    { labelKey: "members", href: `${base}/membres`, icon: Users2, requires: "PRO" },
    { labelKey: "billing", href: `${base}/facturation`, icon: CreditCard },
    { labelKey: "settings", href: `${base}/parametres`, icon: Settings },
    { labelKey: "myShops", href: "/boutiques", icon: Store },
  ];
}

function SheetFooter({ onClose }: { onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("header");
  return (
    <div className="flex items-center gap-2 px-3">
      <Link
        href="/profil"
        onClick={onClose}
        className="flex flex-1 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-zinc-400 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shrink-0">
          <User className="h-5 w-5" />
        </span>
        <span>{t("profile")}</span>
      </Link>
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-zinc-400 transition-colors hover:bg-white/20 hover:text-white active:scale-90 shrink-0 relative"
        aria-label={t("toggleTheme")}
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
      </button>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300 active:scale-90 shrink-0"
        aria-label={t("logout")}
      >
        <LogOut className="h-5 w-5" />
      </button>
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname() || "";
  const params = useParams();
  const boutiqueId = params?.id as string | undefined;
  const isAdmin = pathname.startsWith("/admin");
  const tNav = useTranslations("sidebar");
  const tb = useTranslations("bottomNav");

  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  let currentPlan: PlanCode | undefined;
  let boutiqueSlug: string | undefined;
  try {
    const ctx = useBoutique();
    currentPlan = ctx.plan?.isActive ? ctx.plan.codePlan : "STARTER";
    boutiqueSlug = ctx.slug;
  } catch {
    // Pas de provider (ex: /boutiques, /admin)
  }

  const items = getBottomNavItems(boutiqueId, isAdmin);
  const quickActions = isAdmin ? [] : getQuickActions(boutiqueId);
  const moreItems = isAdmin
    ? getMoreMenuItems(undefined, true)
    : (boutiqueId ? getMoreMenuItems(boutiqueId, false, boutiqueSlug) : []);

  // Check if any "more" item is active (but NOT if a main nav item is active)
  const mainHrefs = new Set(items.map((i) => i.href));
  const isMainNavActive = items.some(
    (item) =>
      pathname === item.href ||
      (item.href.length > (isAdmin ? "/admin/".length : "/boutiques/".length) &&
        pathname.startsWith(item.href + "/") &&
        !items.some(
          (other) =>
            other.href !== item.href &&
            other.href.length > item.href.length &&
            pathname.startsWith(other.href)
        ))
  );
  const isMoreActive =
    !isMainNavActive &&
    moreItems.some(
      (item) =>
        !item.external &&
        !mainHrefs.has(item.href) &&
        (pathname === item.href || pathname.startsWith(item.href + "/"))
    );

  const close = useCallback(() => setSheetOpen(false), []);

  // Close on route change
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Close on click outside
  useEffect(() => {
    if (!sheetOpen) return;
    function handleClick(e: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        close();
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClick);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClick);
    };
  }, [sheetOpen, close]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  return (
    <div className="lg:hidden">
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          sheetOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={close}
      />

      {/* Bottom Sheet — positioned above the nav bar */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed left-0 right-0 bottom-[76px] z-50 transition-transform duration-300 ease-out will-change-transform",
          sheetOpen
            ? "translate-y-0"
            : "translate-y-[calc(100%+76px)] pointer-events-none"
        )}
      >
        <div className="mx-2 overflow-hidden rounded-3xl bg-zinc-900/95 shadow-2xl shadow-black/40 ring-1 ring-white/10 backdrop-blur-2xl">
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-3 pt-1">
            <h3 className="text-sm font-black uppercase tracking-widest text-white/60">
              {tb("navigation")}
            </h3>
            <button
              onClick={close}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition-all hover:bg-white/20 hover:text-white active:scale-90"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="max-h-[65vh] overflow-y-auto overscroll-contain px-3 pb-2">
            {/* Quick actions */}
            {quickActions.length > 0 && (
              <div className="mb-3">
                <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                  {tb("quickActions")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((qa) => {
                    const Icon = qa.icon;
                    return (
                      <Link
                        key={qa.href}
                        href={qa.href}
                        onClick={close}
                        className="group flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-3 text-left transition-all hover:bg-white/10 active:scale-95"
                      >
                        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl shrink-0 shadow-lg", qa.color)}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-black leading-tight text-white truncate">
                            {tb(`quick.${qa.labelKey}`)}
                          </p>
                          <p className="text-[9px] font-bold text-white/40 flex items-center gap-1">
                            <Plus className="h-2.5 w-2.5" /> {tb("create")}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation grid */}
            {moreItems.length > 0 && (
              <>
                <p className="px-2 pt-1 pb-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                  {tb("allSections")}
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {moreItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive =
                      !item.external &&
                      (pathname === item.href ||
                        (item.href.length > (isAdmin ? "/admin/".length : "/boutiques/".length) &&
                          pathname.startsWith(item.href + "/")));
                    const locked = isLocked(item, currentPlan);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        target={item.external ? "_blank" : undefined}
                        rel={item.external ? "noopener noreferrer" : undefined}
                        onClick={close}
                        className={cn(
                          "relative flex flex-col items-center justify-center gap-1.5 rounded-2xl px-1 py-3 text-center transition-all duration-200 active:scale-90",
                          isActive
                            ? "bg-brand/20 text-brand"
                            : "text-zinc-400 hover:bg-white/5 hover:text-white"
                        )}
                        style={{
                          animationDelay: `${index * 30}ms`,
                        }}
                      >
                        <span
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                            isActive ? "bg-brand/20" : "bg-white/5"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="text-[10px] font-bold leading-tight">
                          {tNav(`items.${item.labelKey}`)}
                        </span>
                        {locked && (
                          <Lock className="absolute top-1.5 right-1.5 h-3 w-3 text-amber-500" aria-label={tNav("planRequired")} />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            {/* Profil + Thème + Déconnexion */}
            <div className="mt-3 border-t border-white/5 pt-3">
              <SheetFooter onClose={close} />
            </div>
          </div>

          <div className="h-2" />
        </div>
      </div>

      {/* Main Bottom Navigation Bar */}
      <nav className="fixed bottom-4 left-3 right-3 z-50">
        <div className="mx-auto max-w-md rounded-2xl bg-zinc-900/90 shadow-2xl shadow-black/30 backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex items-center justify-around px-1 py-2">
            {items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href.length > (isAdmin ? "/admin/".length : "/boutiques/".length) &&
                  pathname.startsWith(item.href + "/") &&
                  !items.some(
                    (other) =>
                      other.href !== item.href &&
                      other.href.length > item.href.length &&
                      pathname.startsWith(other.href)
                  ));

              const Icon = item.icon;
              const locked = isLocked(item, currentPlan);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-0.5 px-2 sm:px-3 py-1.5 text-[10px] font-bold transition-all duration-300 active:scale-90",
                    isActive
                      ? "text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {isActive && (
                    <span className="absolute inset-0 -top-0.5 rounded-xl bg-brand/20" />
                  )}
                  <span className="relative z-10">
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-transform duration-300",
                        isActive && "scale-110"
                      )}
                    />
                  </span>
                  <span className="relative z-10 truncate max-w-[60px]">{tNav(`items.${item.labelKey}`)}</span>
                  {isActive && (
                    <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-brand" />
                  )}
                  {locked && (
                    <Lock className="absolute top-0 right-1 h-2.5 w-2.5 text-amber-500" aria-label={tNav("planRequired")} />
                  )}
                </Link>
              );
            })}

            {/* Plus / More button */}
            {(boutiqueId || isAdmin) && (
              <button
                onClick={() => setSheetOpen((o) => !o)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 px-2 sm:px-3 py-1.5 text-[10px] font-bold transition-all duration-300 active:scale-90",
                  sheetOpen || isMoreActive
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
                aria-label={tb("moreNav")}
                aria-expanded={sheetOpen}
              >
                {(sheetOpen || isMoreActive) && (
                  <span className="absolute inset-0 -top-0.5 rounded-xl bg-brand/20" />
                )}
                <span className="relative z-10">
                  <Menu
                    className={cn(
                      "h-5 w-5 transition-transform duration-300",
                      sheetOpen && "rotate-90"
                    )}
                  />
                </span>
                <span className="relative z-10">{tb("more")}</span>
                {isMoreActive && !sheetOpen && (
                  <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-brand" />
                )}
              </button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
