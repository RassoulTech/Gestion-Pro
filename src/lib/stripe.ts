import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Lazy-init du client Stripe.
 *
 * Pourquoi : si on instancie `new Stripe()` au top-level, le build Next.js
 * (étape "Collecting page data") évalue ce module pour les routes qui
 * l'importent (ex. /api/webhooks/stripe). Sans STRIPE_SECRET_KEY défini,
 * le SDK Stripe v22 jette "Neither apiKey nor config.authenticator
 * provided" et casse le build entier. Avec une factory, l'erreur n'est
 * levée qu'au premier appel runtime — quand Stripe est réellement utilisé.
 */
export function getStripe(): Stripe {
  if (cached) return cached;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY n'est pas configurée. Activez STRIPE_ENABLED et renseignez la clé."
    );
  }

  cached = new Stripe(key, {
    apiVersion: "2024-12-22.acacia" as any,
    typescript: true,
  });

  return cached;
}
