import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

// Instance Edge-safe (sans adapter Prisma ni bcrypt) pour le middleware.
const { auth } = NextAuth(authConfig);

/**
 * CSP STRICTE basée sur un nonce par requête.
 * - `script-src` : nonce + 'strict-dynamic' → les navigateurs modernes ne font
 *   confiance qu'aux scripts portant le nonce (et à ceux qu'ils chargent), et
 *   IGNORENT 'unsafe-inline'/https: (présents seulement en repli legacy).
 *   Next.js applique automatiquement ce nonce à SES propres <script> (il le lit
 *   dans le header de requête `Content-Security-Policy` ci-dessous). L'app
 *   n'utilise aucun <script> tiers, donc rien d'autre à noncer.
 * - `style-src 'unsafe-inline'` : requis par React/Next/framer-motion (styles
 *   inline) — l'injection de style est à faible risque.
 * - data-fetch (`connect/img/font/frame`) tolérants en https: pour ne casser
 *   aucune intégration ; le durcissement clé porte sur les scripts.
 */
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https:`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https:",
    "frame-src 'self' https:",
  ].join("; ");
}

export default auth((req) => {
  // Ce callback ne s'exécute que pour les requêtes AUTORISÉES : le callback
  // `authorized` d'auth.config gère les redirections /admin et /boutiques (et
  // renvoie `true` pour les routes publiques). Les redirections ne reçoivent pas
  // de CSP — sans intérêt (pas de HTML).
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next lit le nonce DANS ce header de requête pour l'appliquer à ses <script>.
  requestHeaders.set("content-security-policy", csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("content-security-policy", csp);
  return res;
});

export const config = {
  // Toutes les routes HTML — on exclut l'API, les assets `_next`, et les fichiers
  // à extension (images, sw.js, manifest…), qui n'ont pas besoin de CSP.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|robots.txt|sitemap.xml|.*\\.[^/]+$).*)",
  ],
};
