"use client";

import { useState, type ReactNode } from "react";

/**
 * Renders an official payment logo from a local asset (public/logos/…).
 * If the file is missing, it gracefully falls back to an inline brand mark
 * so the UI never shows a broken image.
 *
 * Drop the official files here to use the real logos app-wide:
 *   public/logos/wave.png
 *   public/logos/orange-money.png
 */
export function PaymentLogo({
  src,
  alt,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  className?: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ objectFit: "contain" }}
      onError={() => setFailed(true)}
    />
  );
}
