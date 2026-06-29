import NextAuth from "next-auth";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { authConfig } from "@/lib/auth.config";

// Instance Edge-safe (sans adapter Prisma ni bcrypt) pour le middleware.
const { auth } = NextAuth(authConfig);

// `auth` utilisé sans callback se comporte comme le middleware NextAuth standard
// (exécute `authorized` d'auth.config → redirige vers /login ou laisse passer).
// On le type comme une fonction de middleware appelable, afin de pouvoir
// l'entourer d'un try/catch (ce que la forme `export default auth` ne permet pas).
const authMiddleware = auth as unknown as (
  req: NextRequest,
  ctx: NextFetchEvent
) => Promise<Response | void> | Response | void;

/**
 * Middleware d'authentification ROBUSTE (anti-crash 500).
 *
 * CAUSE RACINE de MIDDLEWARE_INVOCATION_FAILED : sur l'Edge runtime de Vercel,
 * l'exécution de NextAuth (`auth()` décode le JWT de session via AUTH_SECRET) peut
 * lever une exception NON CAPTURÉE sur certaines requêtes (cookie/JWT atypique,
 * crawler…). Sans gestion d'erreur, cela fait tomber TOUT le middleware en 500 —
 * visible surtout sur /boutiques (landing post-login = trafic authentifié maximal).
 *
 * CORRECTIF : on délègue à NextAuth DANS un try/catch. En cas d'erreur imprévue,
 * on ne renvoie JAMAIS de 500 → on laisse passer la requête (`NextResponse.next()`).
 * C'est SÛR car la protection réelle est refaite côté SERVEUR (runtime Node,
 * fiable), indépendamment du middleware :
 *   - (dashboard)/layout.tsx       → auth() + redirect("/login")
 *   - (dashboard)/admin/layout.tsx → requireRole("ADMIN")
 *   - boutiques/[id]/layout.tsx    → contrôle d'appartenance (anti-IDOR)
 * Un échec du middleware ne peut donc EXPOSER aucune donnée : au pire l'utilisateur
 * atteint la page, dont le layout serveur le redirige proprement.
 */
export default async function middleware(req: NextRequest, ctx: NextFetchEvent) {
  try {
    const result = await authMiddleware(req, ctx);
    return result ?? NextResponse.next();
  } catch (error) {
    console.error(
      "[middleware] échec d'auth NextAuth (Edge) — fail-open, les gardes serveur prennent le relais :",
      error
    );
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/boutiques/:path*", "/dashboard/:path*", "/admin/:path*"],
};
