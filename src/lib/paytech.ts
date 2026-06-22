/**
 * Configuration PayTech centralisée — source de vérité UNIQUE pour les paiements.
 *
 * Aucune clé ni URL n'est codée en dur ailleurs dans l'app : tout flux de paiement
 * (abonnement, renouvellement, commande marketplace) passe par ce module.
 *
 * Sandbox vs Live :
 * - Par défaut on est en SANDBOX (test), fidèle à la prod mais sans débit réel.
 * - Passage en LIVE = uniquement changer les clés + poser PAYTECH_SANDBOX=false
 *   (ou PAYTECH_ENV=prod). AUCUNE logique métier à modifier.
 *
 * Lecture de `process.env` à CHAQUE appel (et non au chargement du module) : indis-
 * pensable en serverless et pour la testabilité (les valeurs peuvent varier par requête).
 *
 * Note : ce module lit des secrets NON `NEXT_PUBLIC_*`. Il ne doit être importé que
 * côté serveur ; un éventuel import client n'exposerait de toute façon aucune clé
 * (Next n'inline que les variables `NEXT_PUBLIC_*`).
 */

export type PaytechEnv = "test" | "prod";

export interface PaytechConfig {
  apiKey: string;
  apiSecret: string;
  /** PAYTECH_ENABLED === "true" */
  enabled: boolean;
  /** true = environnement de test PayTech (aucun débit réel) */
  sandbox: boolean;
  /** Valeur `env` envoyée à l'API PayTech ("test" | "prod") */
  env: PaytechEnv;
  /** Base de l'API PayTech */
  baseUrl: string;
  /** Endpoint de création de paiement */
  requestPaymentUrl: string;
  /** URL publique de l'app (sans slash final) */
  appUrl: string;
  /** URL de notification serveur-à-serveur (IPN/webhook) */
  ipnUrl: string;
  /** Devise des transactions */
  currency: string;
}

const PAYTECH_BASE_URL = "https://paytech.sn";

/**
 * Construit la configuration PayTech à partir de l'environnement courant.
 * Conserve les noms de variables existants (PAYTECH_API_KEY / PAYTECH_API_SECRET /
 * PAYTECH_ENV / PAYTECH_ENABLED) déjà configurés en production.
 */
export function getPaytechConfig(): PaytechConfig {
  const apiKey = process.env.PAYTECH_API_KEY ?? "";
  const apiSecret = process.env.PAYTECH_API_SECRET ?? "";
  const enabled = process.env.PAYTECH_ENABLED === "true";

  // Sandbox par défaut. On bascule en LIVE seulement si demandé explicitement via
  // PAYTECH_SANDBOX=false, ou via PAYTECH_ENV=prod|live (rétro-compatibilité).
  const envValue = (process.env.PAYTECH_ENV ?? "").toLowerCase();
  const explicitSandbox = process.env.PAYTECH_SANDBOX;
  const sandbox =
    explicitSandbox != null && explicitSandbox !== ""
      ? explicitSandbox.toLowerCase() !== "false"
      : !(envValue === "prod" || envValue === "live");

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/+$/,
    ""
  );

  return {
    apiKey,
    apiSecret,
    enabled,
    sandbox,
    env: sandbox ? "test" : "prod",
    baseUrl: PAYTECH_BASE_URL,
    requestPaymentUrl: `${PAYTECH_BASE_URL}/api/payment/request-payment`,
    appUrl,
    ipnUrl: `${appUrl}/api/paytech/ipn`,
    currency: "XOF",
  };
}

/** PayTech est-il activé ET correctement configuré (clés présentes) ? */
export function isPaytechConfigured(): boolean {
  const c = getPaytechConfig();
  return c.enabled && !!c.apiKey && !!c.apiSecret;
}

/** Sommes-nous en environnement de test PayTech ? (pour le badge UI) */
export function isPaytechSandbox(): boolean {
  return getPaytechConfig().sandbox;
}

export interface PaytechCheckoutParams {
  /** Libellé de l'article affiché sur la page PayTech */
  itemName: string;
  /** Montant à débiter (entier dans la devise XOF) */
  amount: number;
  /** Référence interne unique (ref_command) — sert de clé de réconciliation */
  refCommand: string;
  /** Nom de la commande affiché côté PayTech */
  commandName?: string;
  /** Métadonnées renvoyées telles quelles dans l'IPN (custom_field) */
  customField?: Record<string, unknown>;
  /** URL de retour en cas de succès */
  successUrl: string;
  /** URL de retour en cas d'annulation */
  cancelUrl: string;
}

export interface PaytechCheckoutResult {
  success: boolean;
  /** URL de redirection vers la page de paiement PayTech */
  redirectUrl?: string;
  /** Token de transaction PayTech */
  token?: string;
  error?: string;
}

/**
 * Crée une session de paiement PayTech (réel, en sandbox ou en live) et renvoie
 * l'URL de redirection. Point d'entrée UNIQUE : utilisé par les abonnements ET les
 * commandes marketplace, pour éviter toute duplication de la logique d'appel.
 */
export async function createPaytechCheckout(
  params: PaytechCheckoutParams
): Promise<PaytechCheckoutResult> {
  const config = getPaytechConfig();

  if (!config.enabled || !config.apiKey || !config.apiSecret) {
    return {
      success: false,
      error: "PayTech n'est pas activé ou configuré sur ce serveur.",
    };
  }

  try {
    const response = await fetch(config.requestPaymentUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        API_KEY: config.apiKey,
        API_SECRET: config.apiSecret,
      },
      body: JSON.stringify({
        item_name: params.itemName,
        item_price: params.amount,
        currency: config.currency,
        ref_command: params.refCommand,
        command_name: params.commandName ?? params.itemName,
        env: config.env,
        ipn_url: config.ipnUrl,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        custom_field: params.customField
          ? JSON.stringify(params.customField)
          : undefined,
      }),
    });

    let data: { success?: number | boolean; token?: string; redirectUrl?: string; redirect_url?: string; message?: string } | null = null;
    if (response.ok) {
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("[paytech] réponse JSON illisible:", parseError);
      }
    }

    if (data && (data.success === 1 || data.success === true)) {
      const redirectUrl = data.redirectUrl || data.redirect_url;
      if (redirectUrl && data.token) {
        return { success: true, redirectUrl, token: data.token };
      }
    }

    console.error("[paytech] échec request-payment:", data ?? "pas de données");
    return {
      success: false,
      error: data?.message || "Impossible d'initier le paiement PayTech.",
    };
  } catch (error) {
    console.error("[paytech] erreur request-payment:", error);
    const message =
      error instanceof Error ? error.message : "Erreur lors de l'appel à PayTech.";
    return { success: false, error: message };
  }
}
