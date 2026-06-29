import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// CSP en mode OBSERVATION (Report-Only) : ne bloque RIEN — signale seulement, dans
// la console du navigateur, ce qu'une CSP stricte bloquerait. Sert à recenser les
// origines tierces réellement chargées avant de passer un jour en mode bloquant
// (avec nonces pour les scripts inline de Next). 'unsafe-inline' est volontairement
// conservé ici : on observe d'abord les origines externes (img/connect/frame).
const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://utfs.io https://lh3.googleusercontent.com",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "connect-src 'self' https://accounts.google.com",
  "frame-src 'self' https://accounts.google.com",
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
