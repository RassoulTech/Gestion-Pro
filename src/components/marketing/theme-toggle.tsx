"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bouton bascule de thème — light / dark.
 * Évite le flash hydratation via état "mounted".
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = React.useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "active-press inline-flex h-9 w-9 items-center justify-center rounded-md",
        "border border-border bg-background text-muted-foreground",
        "transition-colors duration-150 ease-out hover:bg-accent hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      <Sun
        className={cn(
          "h-4 w-4 transition-transform duration-200",
          isDark ? "scale-0 rotate-90" : "scale-100 rotate-0"
        )}
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-transform duration-200",
          isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90"
        )}
        strokeWidth={1.5}
        aria-hidden="true"
      />
    </button>
  );
}
