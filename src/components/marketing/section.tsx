import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Wrapper de section marketing — espacement vertical cohérent + container responsive.
 * @example <Section id="features" tone="muted">...</Section>
 */
type SectionProps = React.HTMLAttributes<HTMLElement> & {
  tone?: "default" | "muted" | "inverse";
  size?: "sm" | "md" | "lg" | "xl";
};

const toneClasses: Record<NonNullable<SectionProps["tone"]>, string> = {
  default: "bg-background",
  muted: "bg-muted/40",
  inverse: "bg-foreground text-background",
};

const sizeClasses: Record<NonNullable<SectionProps["size"]>, string> = {
  sm: "py-16 sm:py-20",
  md: "py-20 sm:py-28",
  lg: "py-24 sm:py-32",
  xl: "py-28 sm:py-36 lg:py-40",
};

export function Section({
  className,
  tone = "default",
  size = "lg",
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(toneClasses[tone], sizeClasses[size], className)}
      {...props}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}

/**
 * En-tête de section : eyebrow (label MAJ), titre display, sous-titre.
 */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto max-w-3xl",
        align === "center" ? "text-center" : "text-left",
        className
      )}
    >
      {eyebrow && (
        <p className="text-label-upper mb-3 text-brand">{eyebrow}</p>
      )}
      <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}
