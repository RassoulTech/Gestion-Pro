import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// CSP en mode OBSERVATION (Report-Only), posée en en-tête STATIQUE — ne bloque RIEN
// (zéro risque de planter le rendu ou le middleware). La variante stricte à nonce
// via middleware a provoqué MIDDLEWARE_INVOCATION_FAILED sur l'Edge runtime Vercel ;
// on reste donc sur cette version sûre. 'unsafe-inline' conservé (Next/React).
const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data: https:",
  "connect-src 'self' https:",
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
        { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
      ],
    },
  ],
};

export default withNextIntl(nextConfig);
