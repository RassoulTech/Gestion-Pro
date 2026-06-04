"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Store,
  Package,
  Users,
  Truck,
  ShoppingCart,
  Zap,
  BarChart3,
  Wallet,
  Settings,
  Users2,
  LayoutDashboard,
  ChevronLeft,
  Tag,
  CreditCard,
  Lock,
  User,
  Calculator,
  QrCode,
  Layers,
  Megaphone,
  FileText,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBoutique } from "@/components/layouts/boutique-provider";

// ─── Types ────────────────────────────────────────────────────

type PlanCode = "STARTER" | "PRO" | "ENTERPRISE";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Minimum plan required for this nav item. If undefined → accessible to all. */
  requires?: PlanCode;
  /** Open in new tab (for external/public pages) */
  external?: boolean;
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

const PLAN_RANK: Record<PlanCode, number> = {
  STARTER: 0,
  PRO: 1,
  ENTERPRISE: 2,
};

function isItemLocked(item: NavItem, currentPlan?: PlanCode): boolean {
  if (!item.requires || !currentPlan) return false;
  return PLAN_RANK[currentPlan] < PLAN_RANK[item.requires];
}

type SidebarProps = {
  boutiqueId?: string;
  boutiqueName?: string;
  mobileOpen?: boolean;
  onMobileCloseAction?: () => void;
  role?: string;
};

// ─── Nav helpers ─────────────────────────────────────────────

function getBoutiqueNavGroups(boutiqueId: string, boutiqueSlug?: string): NavGroup[] {
  const base = `/boutiques/${boutiqueId}`;
  return [
    {
      items: [
        { label: "Dashboard", href: base, icon: LayoutDashboard },
      ],
    },
    {
      label: "Gestion commerciale",
      items: [
        { label: "Commandes", href: `${base}/commandes`, icon: ShoppingCart },
        { label: "Produits", href: `${base}/produits`, icon: Package },
        { label: "Stock", href: `${base}/stock`, icon: Layers, requires: "PRO" },
        { label: "Clients", href: `${base}/clients`, icon: Users },
        { label: "Catégories", href: `${base}/categories`, icon: Tag },
        { label: "Caisse", href: `${base}/pos`, icon: Calculator, requires: "PRO" },
        { label: "Ventes Flash", href: `${base}/ventes-flash`, icon: Zap, requires: "PRO" },
      ],
    },
    {
      label: "Gestion financière",
      items: [
        { label: "Factures", href: `${base}/factures`, icon: FileText, requires: "PRO" },
        { label: "Dépenses", href: `${base}/depenses`, icon: Wallet },
        { label: "Achats Fournisseurs", href: `${base}/commandes-fournisseur`, icon: Truck },
        { label: "Rapports", href: `${base}/rapports`, icon: BarChart3, requires: "PRO" },
      ],
    },
    {
      label: "Fournisseurs",
      items: [
        { label: "Fournisseurs", href: `${base}/fournisseurs`, icon: Truck },
      ],
    },
    {
      label: "Marketing & Visibilité",
      items: [
        {
          label: "Ma Boutique",
          href: boutiqueSlug ? `/s/${boutiqueSlug}` : `${base}/parametres?tab=boutique`,
          icon: Store,
          external: !!boutiqueSlug,
        },
        { label: "QR Code Boutique", href: `${base}/qrcode`, icon: QrCode },
        { label: "Marketplace", href: `/marketplace`, icon: Megaphone, external: true },
      ],
    },
    {
      label: "Compte",
      items: [
        { label: "Membres", href: `${base}/membres`, icon: Users2, requires: "PRO" },
        { label: "Facturation", href: `${base}/facturation`, icon: CreditCard },
        { label: "Paramètres", href: `${base}/parametres`, icon: Settings },
      ],
    },
  ];
}

function getAdminNavGroups(): NavGroup[] {
  return [
    {
      items: [
        { label: "Dashboard Global", href: "/admin/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "Utilisateurs",
      items: [
        { label: "Vendeurs", href: "/admin/vendeurs", icon: Users },
        { label: "Utilisateurs", href: "/admin/utilisateurs", icon: User },
        { label: "Boutiques", href: "/admin/boutiques", icon: Store },
      ],
    },
    {
      label: "Facturation",
      items: [
        { label: "Abonnements", href: "/admin/abonnements", icon: CreditCard },
        { label: "Plans", href: "/admin/plans", icon: Tag },
        { label: "Revenus", href: "/admin/revenus", icon: Wallet },
      ],
    },
    {
      label: "Audit",
      items: [
        { label: "Logs & Activités", href: "/admin/logs", icon: FileText },
      ],
    },
  ];
}

// ─── NavLink ─────────────────────────────────────────────────

function NavLink({
  item,
  pathname,
  collapsed,
  onClick,
  locked,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onClick?: () => void;
  locked?: boolean;
}) {
  const Icon = item.icon;

  // Exact match for base boutique route, starts-with for sub-routes
  // Skip "active" detection for external links (public pages)
  const isActive =
    !item.external &&
    (pathname === item.href ||
      (item.href !== "/boutiques" &&
        item.href.startsWith("/boutiques/") &&
        item.href.length > "/boutiques/".length &&
        pathname.startsWith(item.href) &&
        pathname !== item.href.replace(/\/[^/]+$/, "")));

  const linkContent = (
    <Link
      href={item.href}
      onClick={onClick}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener noreferrer" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
        "hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
        isActive
          ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
          : "text-zinc-500 dark:text-zinc-400",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive
            ? "text-zinc-900 dark:text-zinc-50"
            : "text-zinc-400 group-hover:text-zinc-900 dark:text-zinc-500 dark:group-hover:text-zinc-50",
        )}
      />
      {!collapsed && (
        <span className="truncate leading-none flex-1">{item.label}</span>
      )}
      {!collapsed && item.external && (
        <Globe className="h-3 w-3 shrink-0 text-zinc-400" aria-label="Lien externe" />
      )}
      {!collapsed && locked && (
        <Lock className="h-3 w-3 shrink-0 text-amber-500" aria-label="Plan supérieur requis" />
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs flex items-center gap-1.5">
          {item.label}
          {locked && <Lock className="h-3 w-3 text-amber-500" />}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

// ─── Sidebar inner content ───────────────────────────────────

function SidebarContent({
  boutiqueId,
  collapsed,
  onToggleCollapse,
  onLinkClick,
  role,
}: {
  boutiqueId?: string;
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onLinkClick?: () => void;
  role?: string;
}) {
  const pathname = usePathname();

  // Récupère le plan courant et le slug depuis le BoutiqueProvider, si disponible.
  let currentPlan: PlanCode | undefined;
  let boutiqueSlug: string | undefined;
  try {
    const ctx = useBoutique();
    currentPlan = ctx.plan?.isActive ? ctx.plan.codePlan : "STARTER";
    boutiqueSlug = ctx.slug;
  } catch {
    // Pas de provider (ex: page /boutiques)
  }

  let navGroups: NavGroup[] = [
    { items: [{ label: "Mes Boutiques", href: "/boutiques", icon: Store }] },
  ];
  if (role === "ADMIN") {
    navGroups = getAdminNavGroups();
  } else if (boutiqueId) {
    navGroups = getBoutiqueNavGroups(boutiqueId, boutiqueSlug);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo + collapse toggle */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-zinc-100 px-4 dark:border-zinc-800",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 overflow-hidden" aria-label="Accueil GestionPro">
            <BrandLogo size={28} rounded={6} />
            <span className="truncate text-sm font-bold text-zinc-800 dark:text-zinc-100">
              Gestion<span className="text-orange-600 dark:text-orange-500">Pro</span>
            </span>
          </Link>
        )}

        {collapsed && (
          <Link href="/" aria-label="Accueil GestionPro" className="flex items-center justify-center">
            <BrandLogo size={28} rounded={6} />
          </Link>
        )}

        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className={cn(
              "h-7 w-7 shrink-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50",
              collapsed && "mt-0",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                collapsed && "rotate-180",
              )}
            />
          </Button>
        )}
      </div>

      {/* Nav groups */}
      <ScrollArea className="flex-1 py-3">
        <nav className="space-y-4 px-2">
          <TooltipProvider delayDuration={0}>
            {navGroups.map((group, gIdx) => (
              <div key={group.label || `group-${gIdx}`} className="space-y-0.5">
                {group.label && !collapsed && (
                  <p className="px-3 pt-1 pb-1 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    {group.label}
                  </p>
                )}
                {group.label && collapsed && gIdx > 0 && (
                  <div className="my-2 mx-2 h-px bg-zinc-100 dark:bg-zinc-800" />
                )}
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    collapsed={collapsed}
                    onClick={onLinkClick}
                    locked={isItemLocked(item, currentPlan)}
                  />
                ))}
              </div>
            ))}
          </TooltipProvider>
        </nav>
      </ScrollArea>

      {/* Bottom section – global nav if in boutique context */}
      {boutiqueId && (
        <div className="shrink-0 border-t border-zinc-100 px-2 py-3 dark:border-zinc-800">
          <TooltipProvider delayDuration={0}>
            <NavLink
              item={{ label: "Mes Boutiques", href: "/boutiques", icon: Store }}
              pathname={pathname}
              collapsed={collapsed}
              onClick={onLinkClick}
            />
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}

// ─── Main Sidebar export ──────────────────────────────────────

export function Sidebar({
  boutiqueId,
  mobileOpen = false,
  onMobileCloseAction,
  role,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-zinc-100 bg-white transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-950 lg:flex lg:flex-col",
          collapsed ? "lg:w-[60px]" : "lg:w-[220px]",
        )}
      >
        <SidebarContent
          boutiqueId={boutiqueId}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          role={role}
        />
      </aside>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileCloseAction?.()}>
        <SheetContent side="left" className="w-[260px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent
            boutiqueId={boutiqueId}
            collapsed={false}
            onLinkClick={onMobileCloseAction}
            role={role}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
