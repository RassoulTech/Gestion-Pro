"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useBoutique } from "@/components/layouts/boutique-provider";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { Sun, Moon, Store, User, LogOut } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ────────────────────────────────────────────────────

type HeaderProps = {
  boutiqueName?: string;
  /** Pre-fetched user info from server – used as fallback before session loads */
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
};

// ─── ThemeToggle ─────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Basculer le thème"
      className="h-9 w-9 text-muted-foreground hover:text-foreground"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

// ─── UserMenu ────────────────────────────────────────────────

function UserMenu({
  userName,
  userEmail,
  userImage,
}: {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
}) {
  const { data: session } = useSession();

  // Prefer session data once loaded, fall back to server-passed props
  const name = session?.user?.name ?? userName ?? "Utilisateur";
  const email = session?.user?.email ?? userEmail ?? "";
  const image = session?.user?.image ?? userImage ?? null;

  const initials = getInitials(name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full p-0 focus-visible:ring-1"
          aria-label="Menu utilisateur"
        >
          <Avatar className="h-8 w-8">
            {image && <AvatarImage src={image} alt={name} />}
            <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-foreground">
              {name}
            </p>
            {email && (
              <p className="truncate text-xs leading-none text-muted-foreground">
                {email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/boutiques" className="cursor-pointer">
              <Store className="mr-2 h-4 w-4" />
              Mes boutiques
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profil" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profil
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Header ──────────────────────────────────────────────────

export function Header({
  boutiqueName,
  userName,
  userEmail,
  userImage,
}: HeaderProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const defaultTitle = isAdmin ? "Centre de Contrôle Admin" : <span className="tracking-tight">Gestion<span className="text-brand">Pro</span></span>;

  let boutiqueLogo: string | null = null;
  try {
    const ctx = useBoutique();
    boutiqueLogo = ctx.logo;
  } catch {
    // Hors contexte boutique
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-card/80 px-4",
        "backdrop-blur-lg supports-[backdrop-filter]:bg-card/70",
      )}
    >
      <div className="flex flex-1 items-center justify-start gap-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {boutiqueLogo && (
            <div className="h-6 w-6 rounded-md overflow-hidden border border-border flex items-center justify-center shrink-0 relative bg-muted shadow-sm">
              <Image 
                src={boutiqueLogo} 
                alt={boutiqueName || "Logo"} 
                fill 
                className="object-cover" 
                sizes="24px"
                unoptimized 
              />
            </div>
          )}
          <span className="truncate text-sm font-bold text-foreground">
            {boutiqueName || defaultTitle}
          </span>
        </div>
      </div>

      {/* Right-side controls */}
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <UserMenu
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
        />
      </div>
    </header>
  );
}
