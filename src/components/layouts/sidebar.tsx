"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Store,
  Package,
  Users,
  Truck,
  ShoppingCart,
  Zap,
  BarChart3,
  Wallet,
  MessageSquare,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBoutique } from "@/components/layouts/boutique-provider";

// ─── Types ────────────────────────────────────────────────────

type PlanCode = "STARTER" | "PRO" | "ENTERPRISE";

type NavItem = {
  /** Clé de traduction sous `sidebar.items.*`. */
  labelKey: string;
  href: string;
  icon: React.ElementType;
  /** Minimum plan required for this nav item. If undefined → accessible to all. */
  requires?: PlanCode;
  /** Open in new tab (for external/public pages) */
  external?: boolean;
};

type NavGroup = {
  /** Clé de traduction sous `sidebar.groups.*`. */
  labelKey?: string;
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
  role?: string;
};

// ─── Nav helpers ─────────────────────────────────────────────

function getBoutiqueNavGroups(boutiqueId: string, boutiqueSlug?: string): NavGroup[] {
  const base = `/boutiques/${boutiqueId}`;
  return [
    {
      items: [
        { labelKey: "dashboard", href: base, icon: LayoutDashboard },
      ],
    },
    {
      labelKey: "commercial",
      items: [
        { labelKey: "orders", href: `${base}/commandes`, icon: ShoppingCart },
        { labelKey: "products", href: `${base}/produits`, icon: Package },
        { labelKey: "stock", href: `${base}/stock`, icon: Layers, requires: "PRO" },
        { labelKey: "clients", href: `${base}/clients`, icon: Users },
        { labelKey: "categories", href: `${base}/categories`, icon: Tag },
        { labelKey: "pos", href: `${base}/pos`, icon: Calculator, requires: "PRO" },
        { labelKey: "flashSales", href: `${base}/ventes-flash`, icon: Zap, requires: "PRO" },
      ],
    },
    {
      labelKey: "financial",
      items: [
        { labelKey: "invoices", href: `${base}/factures`, icon: FileText, requires: "PRO" },
        { labelKey: "expenses", href: `${base}/depenses`, icon: Wallet },
        { labelKey: "supplierPurchases", href: `${base}/commandes-fournisseur`, icon: Truck },
        { labelKey: "reports", href: `${base}/rapports`, icon: BarChart3, requires: "PRO" },
      ],
    },
    {
      labelKey: "suppliers",
      items: [
        { labelKey: "suppliers", href: `${base}/fournisseurs`, icon: Truck },
      ],
    },
    {
      labelKey: "marketing",
      items: [
        {
          labelKey: "myShop",
          href: boutiqueSlug ? `/s/${boutiqueSlug}` : `${base}/parametres?tab=boutique`,
          icon: Store,
          external: !!boutiqueSlug,
        },
        { labelKey: "qrcode", href: `${base}/qrcode`, icon: QrCode },
        { labelKey: "marketplace", href: `/marketplace`, icon: Megaphone, external: true },
      ],
    },
    {
      labelKey: "account",
      items: [
        { labelKey: "members", href: `${base}/membres`, icon: Users2, requires: "PRO" },
        { labelKey: "billing", href: `${base}/facturation`, icon: CreditCard },
        { labelKey: "settings", href: `${base}/parametres`, icon: Settings },
      ],
    },
  ];
}

function getAdminNavGroups(): NavGroup[] {
  return [
    {
      items: [
        { labelKey: "globalDashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      labelKey: "users",
      items: [
        { labelKey: "sellers", href: "/admin/vendeurs", icon: Users },
        { labelKey: "users", href: "/admin/utilisateurs", icon: User },
        { labelKey: "shops", href: "/admin/boutiques", icon: Store },
      ],
    },
    {
      labelKey: "billing",
      items: [
        { labelKey: "subscriptions", href: "/admin/abonnements", icon: CreditCard },
        { labelKey: "plans", href: "/admin/plans", icon: Tag },
        { labelKey: "revenue", href: "/admin/revenus", icon: Wallet },
      ],
    },
    {
      labelKey: "audit",
      items: [
        { labelKey: "messages", href: "/admin/messages", icon: MessageSquare },
        { labelKey: "logs", href: "/admin/logs", icon: FileText },
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
  const t = useTranslations("sidebar");
  const label = t(`items.${item.labelKey}`);
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
        "hover:bg-accent hover:text-accent-foreground",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive
            ? "text-accent-foreground"
            : "text-muted-foreground group-hover:text-accent-foreground",
        )}
      />
      {!collapsed && (
        <span className="truncate leading-none flex-1">{label}</span>
      )}
      {!collapsed && item.external && (
        <Globe className="h-3 w-3 shrink-0 text-muted-foreground" aria-label={t("externalLink")} />
      )}
      {!collapsed && locked && (
        <Lock className="h-3 w-3 shrink-0 text-amber-500" aria-label={t("planRequired")} />
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs flex items-center gap-1.5">
          {label}
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
  const t = useTranslations("sidebar");

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
    { items: [{ labelKey: "myShops", href: "/boutiques", icon: Store }] },
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
          "flex h-14 shrink-0 items-center border-b border-border px-4",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 overflow-hidden" aria-label="Accueil GestionPro">
            <BrandLogo size={28} rounded={6} />
            <span className="truncate text-sm font-bold text-foreground">
              Gestion<span className="text-brand">Pro</span>
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
              "h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground",
              collapsed && "mt-0",
            )}
            aria-label={collapsed ? t("expand") : t("collapse")}
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
              <div key={group.labelKey || `group-${gIdx}`} className="space-y-0.5">
                {group.labelKey && !collapsed && (
                  <p className="px-3 pt-1 pb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {t(`groups.${group.labelKey}`)}
                  </p>
                )}
                {group.labelKey && collapsed && gIdx > 0 && (
                  <div className="my-2 mx-2 h-px bg-border" />
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
        <div className="shrink-0 border-t border-border px-2 py-3">
          <TooltipProvider delayDuration={0}>
            <NavLink
              item={{ labelKey: "myShops", href: "/boutiques", icon: Store }}
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

export function Sidebar({ boutiqueId, role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  // La navigation mobile passe par la BottomNav — pas de drawer mobile ici.
  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r border-border bg-card transition-all duration-200 lg:flex lg:flex-col",
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
  );
}
