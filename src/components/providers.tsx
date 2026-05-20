"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { Session } from "next-auth";

/**
 * Wrapper client-side qui fournit Session + Theme à toute l'app.
 * - `session` reçu du Server Component (root layout) → évite le fetch initial
 *   `/api/auth/session` qui, en dev/Turbopack, peut renvoyer l'overlay HTML
 *   pendant une recompilation et provoquer "ClientFetchError: Unexpected token <".
 * - refetchOnWindowFocus=false + refetchInterval=0 : pas de polling, pas de
 *   refetch au focus → la session reste celle hydratée côté serveur.
 */
export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
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
