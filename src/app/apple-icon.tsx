import { ImageResponse } from "next/og";

// iOS home screen icon. Next.js auto-generates the link tag in <head>.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #EA580C 0%, #7C2D12 100%)",
          color: "#ffffff",
          fontSize: 130,
          fontWeight: 900,
          letterSpacing: -6,
          borderRadius: 40,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        G
      </div>
    ),
    { ...size }
  );
}
