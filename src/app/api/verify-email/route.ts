import { NextResponse, type NextRequest } from "next/server";
import { verifyEmailToken } from "@/server/services/email-verification";

// Vérification d'email = effet de bord en base → jamais mise en cache.
export const dynamic = "force-dynamic";

/**
 * Route publique (PAS de session requise) ciblée par le lien de l'email de
 * vérification : `/api/verify-email?token=<brut>`.
 *
 * Elle valide le token côté serveur, persiste l'état "vérifié", puis redirige
 * vers la page `/verify-email?status=...` qui affiche le résultat. Fonctionne
 * même si le JavaScript client ne s'exécute pas (robustesse, pas d'échec
 * silencieux). Les redirections restent sur l'origine réellement visitée par
 * l'utilisateur (`req.nextUrl.origin`), ce qui évite tout décalage de domaine.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const token = req.nextUrl.searchParams.get("token");

  const redirectTo = (status: string) =>
    NextResponse.redirect(new URL(`/verify-email?status=${status}`, origin));

  if (!token) {
    return redirectTo("invalid");
  }

  try {
    const result = await verifyEmailToken(token);
    // Succès + boutique créée → on transmet l'id pour rediriger l'utilisateur
    // DIRECTEMENT dans sa boutique (via /login avec callbackUrl) après connexion.
    if (result.status === "success" && result.boutiqueId) {
      return NextResponse.redirect(
        new URL(`/verify-email?status=success&boutiqueId=${result.boutiqueId}`, origin)
      );
    }
    return redirectTo(result.status);
  } catch (e) {
    console.error("[verify-email] verification failed:", e);
    return redirectTo("error");
  }
}
