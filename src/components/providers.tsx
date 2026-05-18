"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

/**
 * Wrapper client-side qui fournit Session + Theme à toute l'app.
 * Indispensable pour que useSession() fonctionne dans les Client Components
 * (ex: UserMenu, ThemeToggle).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
