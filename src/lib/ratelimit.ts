import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const upstashConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
const isProduction = process.env.NODE_ENV === "production";

if (!upstashConfigured && isProduction) {
  // ⚠️ SECURITY : en production, l'absence d'Upstash NE doit PAS désactiver
  // silencieusement le rate-limiting (brute-force / credential stuffing /
  // bombardement d'emails ouverts). On bascule en mode REFUS (fail-closed) et
  // on alerte bruyamment. Configurer UPSTASH_REDIS_REST_URL/TOKEN pour rétablir.
  console.error(
    "[ratelimit] FAIL-CLOSED — Upstash Redis non configuré en production. " +
      "Le rate-limiting refuse toutes les requêtes sensibles jusqu'à ce que " +
      "UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN soient définis."
  );
}

/**
 * Limiteur de secours quand Upstash n'est pas configuré :
 * - développement → no-op (laisse passer) pour ne pas gêner le dev local ;
 * - production    → refuse (fail-closed) pour ne jamais ouvrir les vannes.
 */
function fallbackLimiter(limit: number) {
  return {
    limit: async () => ({
      success: !isProduction,
      limit,
      remaining: isProduction ? 0 : limit - 1,
      reset: Date.now() + 60_000,
    }),
  };
}

function buildRatelimiter(tokens: number, prefix: string) {
  if (!upstashConfigured) {
    return fallbackLimiter(tokens);
  }

  return new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    }),
    limiter: Ratelimit.slidingWindow(tokens, "60 s"),
    analytics: true,
    prefix,
  });
}

export const ratelimit = buildRatelimiter(10, "gestionpro:ratelimit");

export const authRatelimit = buildRatelimiter(5, "gestionpro:auth");
