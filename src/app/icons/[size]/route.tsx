import { ImageResponse } from "next/og";

// Icônes PWA générées à la volée (192 et 512), mêmes codes visuels que
// l'apple-icon : "G" blanc sur dégradé brand. Plein cadre (pas d'arrondi) :
// les launchers appliquent leur propre masque.
const ALLOWED_SIZES = new Set([192, 512]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: rawSize } = await params;
  const size = Number(rawSize);

  if (!ALLOWED_SIZES.has(size)) {
    return new Response("Not found", { status: 404 });
  }

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
          fontSize: Math.round(size * 0.62),
          fontWeight: 900,
          letterSpacing: Math.round(size * -0.03),
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        G
      </div>
    ),
    { width: size, height: size }
  );
}
