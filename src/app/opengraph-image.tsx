import { ImageResponse } from "next/og";

// Social share preview (Facebook, X/Twitter, LinkedIn, WhatsApp, Slack…).
// Next.js generates the og:image and twitter:image meta tags automatically.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "GestionPro — Gestion commerciale multi-boutiques";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: 80,
          gap: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 200,
            height: 200,
            borderRadius: 56,
            background: "linear-gradient(135deg, #EA580C 0%, #7C2D12 100%)",
            fontSize: 150,
            fontWeight: 900,
            letterSpacing: -8,
            boxShadow: "0 30px 60px -20px rgba(234, 88, 12, 0.5)",
          }}
        >
          G
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 900,
            letterSpacing: -2,
            textAlign: "center",
            lineHeight: 1,
          }}
        >
          GestionPro
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 500,
            color: "#94A3B8",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          Gestion commerciale, POS et marketplace multi-boutiques pour l&apos;Afrique
        </div>
      </div>
    ),
    { ...size }
  );
}
