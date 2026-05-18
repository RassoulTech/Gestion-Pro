"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { Sun, Moon, Menu, Store, User, LogOut } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
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
  onToggleSidebar?: () => void;
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
      className="h-9 w-9 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
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
            <AvatarFallback className="bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-zinc-900 dark:text-zinc-50">
              {name}
            </p>
            {email && (
              <p className="truncate text-xs leading-none text-zinc-500 dark:text-zinc-400">
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
          className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950 dark:focus:text-red-300"
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
  onToggleSidebar,
  userName,
  userEmail,
  userImage,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "hidden lg:flex h-14 shrink-0 items-center gap-3 border-b border-zinc-100 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950",
      )}
    >
      {/* Boutique name */}
      {boutiqueName && (
        <div className="flex flex-1 items-center justify-start">
          <span className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {boutiqueName}
          </span>
        </div>
      )}

      {/* Spacer when no boutique name */}
      {!boutiqueName && <div className="flex-1" />}

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
