import { cn } from "@/lib/utils";

/**
 * GestionPro brand mark.
 *
 * Single source of truth for the logo across navbar, sidebar, auth screens
 * and email headers (rendered as inline SVG so it ships with the HTML and
 * inherits color/sizing from the parent rather than depending on an asset
 * fetch). The same shape is mirrored by src/app/icon.svg for the favicon
 * and by src/app/apple-icon.tsx for iOS.
 */
export function BrandLogo({
  size = 36,
  rounded = 12,
  className,
  variant = "brand",
}: {
  size?: number;
  /** Border radius in px. */
  rounded?: number;
  className?: string;
  /**
   * "brand"  → orange premium gradient (default, marketing + dashboard).
   * "neutral" → dark slate background, white G (sidebar collapsed state).
   */
  variant?: "brand" | "neutral";
}) {
  const gradientId = `brand-grad-${variant}`;
  const colors =
    variant === "brand"
      ? { from: "#EA580C", to: "#7C2D12" }
      : { from: "#18181B", to: "#0A0A0A" };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="GestionPro"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={colors.from} />
          <stop offset="1" stopColor={colors.to} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx={rounded * (64 / size)} ry={rounded * (64 / size)} fill={`url(#${gradientId})`} />
      <text
        x="32"
        y="48"
        textAnchor="middle"
        fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
        fontWeight="900"
        fontSize="44"
        fill="#ffffff"
        letterSpacing="-2"
      >
        G
      </text>
    </svg>
  );
}
