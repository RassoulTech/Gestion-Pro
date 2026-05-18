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
  Activity,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

// ─── Types ────────────────────────────────────────────────────

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

type SidebarProps = {
  boutiqueId?: string;
  boutiqueName?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  role?: string;
};

// ─── Nav helpers ─────────────────────────────────────────────

function getBoutiqueNav(boutiqueId: string): NavItem[] {
  const base = `/boutiques/${boutiqueId}`;
  return [
    { label: "Dashboard", href: base, icon: LayoutDashboard },
    { label: "Produits", href: `${base}/produits`, icon: Package },
    { label: "Catégories", href: `${base}/categories`, icon: Tag },
    { label: "Clients", href: `${base}/clients`, icon: Users },
    { label: "Fournisseurs", href: `${base}/fournisseurs`, icon: Truck },
    { label: "Commandes", href: `${base}/commandes`, icon: ShoppingCart },
    {
      label: "Achats Fournisseur",
      href: `${base}/commandes-fournisseur`,
      icon: Truck,
    },
    { label: "Ventes Flash", href: `${base}/ventes-flash`, icon: Zap },
    { label: "Stock", href: `${base}/stock`, icon: Store },
    { label: "Dépenses", href: `${base}/depenses`, icon: Wallet },
    { label: "Rapports", href: `${base}/rapports`, icon: BarChart3 },
    { label: "Membres", href: `${base}/membres`, icon: Users2 },
    { label: "Paramètres", href: `${base}/parametres`, icon: Settings },
  ];
}

function getAdminNav(): NavItem[] {
  return [
    { label: "Dashboard Global", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Utilisateurs / Vendeurs", href: "/admin/vendeurs", icon: Users },
    { label: "Boutiques", href: "/admin/boutiques", icon: Store },
    { label: "Abonnements", href: "/admin/abonnements", icon: CreditCard },
    { label: "Plans", href: "/admin/plans", icon: Tag },
    { label: "Revenus", href: "/admin/revenus", icon: Wallet },
    { label: "Logs & Activités", href: "/admin/logs", icon: FileText },
  ];
}

const globalNav: NavItem[] = [
  { label: "Mes Boutiques", href: "/boutiques", icon: Store },
];

// ─── NavLink ─────────────────────────────────────────────────

function NavLink({
  item,
  pathname,
  collapsed,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  // Exact match for base boutique route, starts-with for sub-routes
  const isActive =
    pathname === item.href ||
    (item.href !== "/boutiques" &&
      item.href.length > "/boutiques/".length &&
      pathname.startsWith(item.href) &&
      pathname !== item.href.replace(/\/[^/]+$/, ""));

  const linkContent = (
    <Link
      href={item.href}
      onClick={onClick}
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
        <span className="truncate leading-none">{item.label}</span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

// ─── Sidebar inner content ───────────────────────────────────

function SidebarContent({
  boutiqueId,
  boutiqueName,
  collapsed,
  onToggleCollapse,
  onLinkClick,
  role,
}: {
  boutiqueId?: string;
  boutiqueName?: string;
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onLinkClick?: () => void;
  role?: string;
}) {
  const pathname = usePathname();
  
  let navItems = globalNav;
  if (role === "ADMIN") {
    navItems = getAdminNav();
  } else if (boutiqueId) {
    navItems = getBoutiqueNav(boutiqueId);
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
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-50 dark:text-zinc-900">
              GP
            </div>
            {boutiqueName && (
              <span className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {boutiqueName}
              </span>
            )}
          </div>
        )}

        {collapsed && (
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-50 dark:text-zinc-900">
            GP
          </div>
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

      {/* Nav items */}
      <ScrollArea className="flex-1 py-3">
        <nav className="space-y-0.5 px-2">
          <TooltipProvider delayDuration={0}>
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
                onClick={onLinkClick}
              />
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
  boutiqueName,
  mobileOpen = false,
  onMobileClose,
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
          boutiqueName={boutiqueName}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          role={role}
        />
      </aside>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose?.()}>
        <SheetContent side="left" className="w-[220px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent
            boutiqueId={boutiqueId}
            boutiqueName={boutiqueName}
            collapsed={false}
            onLinkClick={onMobileClose}
            role={role}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
