import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// CSP APPLIQUÉE (enforcing), posée en en-tête STATIQUE — pas de middleware, donc
// AUCUN risque de MIDDLEWARE_INVOCATION_FAILED (cf. l'outage de la variante à nonce
// sur l'Edge runtime Vercel). 'unsafe-inline' est conservé pour les scripts/styles :
// indispensable aux scripts d'hydratation inline de Next/React (sinon écran blanc),
// et l'app ne charge AUCUN script tiers. Ça bloque malgré tout : scripts externes
// injectés (script-src n'autorise que 'self'), objets/plugins, framing (clickjacking),
// détournement de <base> et de l'action des formulaires. connect/img/font/frame
// tolérants (https:/wss:) pour ne casser aucune intégration.
const cspPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data: https:",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https:",
].join("; ");

const nextConfig: NextConfig = {
  experimental: {
    // typedRoutes: true,
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        { key: "Content-Security-Policy", value: cspPolicy },
      ],
    },
  ],
};

export default withNextIntl(nextConfig);
