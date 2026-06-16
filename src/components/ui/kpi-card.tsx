import * as React from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * KpiCard — carte statistique premium, réutilisable et mobile-first.
 *
 * Présentation uniquement : la valeur arrive déjà formatée (string). Aucune
 * logique métier ici. Marque = orange (`brand`) ; le vert est réservé au tone
 * `success`. Micro-interactions 100 % CSS → reste un Server Component.
 *
 * @example
 *   <KpiCard label="Chiffre d'affaires" value="454 000 F CFA" icon={TrendingUp}
 *            tone="success" subtext="Sur 30j · 6 factures" accent />
 */

export type KpiTone = "brand" | "success" | "warning" | "danger" | "neutral";

// NB: classes en dur (pas de transformation runtime) pour que le JIT Tailwind
// les génère. ::before = halo radial (glow), ::after = liseré d'accent (bar).
const TONE: Record<
  KpiTone,
  { icon: string; bar: string; glow: string }
> = {
  brand: {
    icon: "bg-brand/10 text-brand ring-brand/15",
    bar: "after:bg-gradient-to-b after:from-brand after:to-brand/40",
    glow: "before:bg-brand/10",
  },
  success: {
    icon: "bg-success/10 text-success ring-success/15",
    bar: "after:bg-gradient-to-b after:from-success after:to-success/40",
    glow: "before:bg-success/10",
  },
  warning: {
    icon: "bg-warning/10 text-warning ring-warning/15",
    bar: "after:bg-gradient-to-b after:from-warning after:to-warning/40",
    glow: "before:bg-warning/10",
  },
  danger: {
    icon: "bg-destructive/10 text-destructive ring-destructive/15",
    bar: "after:bg-gradient-to-b after:from-destructive after:to-destructive/40",
    glow: "before:bg-destructive/10",
  },
  neutral: {
    icon: "bg-muted text-muted-foreground ring-border/60",
    bar: "after:bg-gradient-to-b after:from-border after:to-border/40",
    glow: "before:bg-foreground/[0.04]",
  },
};

export interface KpiTrend {
  /** Variation en pourcentage déjà calculée (ex. -12.5 pour -12,5 %). */
  value: number;
  /** Libellé de contexte (ex. "vs mois dernier"). */
  label?: string;
}

export interface KpiCardProps {
  label: string;
  /** Valeur principale, déjà formatée (ex. via formatPrice). */
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: KpiTone;
  subtext?: React.ReactNode;
  /** Tendance optionnelle — n'afficher que si le delta existe réellement. */
  trend?: KpiTrend;
  /** Liseré d'accent coloré à gauche. */
  accent?: boolean;
  /** Rend la carte cliquable (cursor-pointer + hover). */
  href?: string;
  className?: string;
}

function CardShell({
  href,
  glow,
  className,
  children,
}: {
  href?: string;
  glow: string;
  className?: string;
  children: React.ReactNode;
}) {
  const base = cn(
    // Surface premium : léger dégradé, bord doux, élévation qui se lève au survol.
    "group relative flex flex-col gap-3.5 overflow-hidden rounded-2xl border border-border/60",
    "bg-gradient-to-b from-card to-card/60 p-4 text-card-foreground shadow-sm sm:p-5",
    "transition-all duration-300 ease-out",
    // Halo radial teinté en haut à droite (pseudo ::before).
    "before:pointer-events-none before:absolute before:-right-10 before:-top-10 before:h-28 before:w-28",
    "before:rounded-full before:blur-2xl before:opacity-0 before:transition-opacity before:duration-500",
    "before:content-[''] group-hover:before:opacity-100",
    glow,
    className
  );
  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          "cursor-pointer hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg active:translate-y-0 active:shadow-md",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        {children}
      </Link>
    );
  }
  return <div className={cn(base, "hover:-translate-y-0.5 hover:shadow-md")}>{children}</div>;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  subtext,
  trend,
  accent = false,
  href,
  className,
}: KpiCardProps) {
  const t = TONE[tone];
  const trendUp = trend ? trend.value >= 0 : false;
  const TrendIcon = trendUp ? ArrowUpRight : ArrowDownRight;

  return (
    <CardShell
      href={href}
      glow={t.glow}
      className={cn(
        accent &&
          "after:absolute after:inset-y-2.5 after:left-0 after:w-1 after:rounded-r-full after:content-['']",
        accent && t.bar,
        accent && "pl-5 sm:pl-6",
        className
      )}
    >
      <div className="relative z-10 flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 transition-transform duration-300 group-hover:scale-105",
            t.icon
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </span>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ring-1",
              trendUp
                ? "bg-success/10 text-success ring-success/15"
                : "bg-destructive/10 text-destructive ring-destructive/15"
            )}
          >
            <TrendIcon className="h-3 w-3" aria-hidden="true" />
            {Math.abs(trend.value).toFixed(1)}%
          </span>
        )}
      </div>

      <div className="relative z-10 min-w-0">
        <p className="truncate text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {/* Montants jamais tronqués : on enroule si nécessaire. Police display pour le caractère éditorial. */}
        <p className="mt-1.5 font-[family-name:var(--font-display)] text-xl font-extrabold leading-none tracking-tight tabular-nums break-words sm:text-2xl">
          {value}
        </p>
        {(subtext || (trend && trend.label)) && (
          <p className="mt-1.5 truncate text-xs font-medium text-muted-foreground">
            {subtext}
            {trend?.label && (
              <span className={cn(subtext && "ml-1")}>{trend.label}</span>
            )}
          </p>
        )}
      </div>
    </CardShell>
  );
}

/** Skeleton homogène pour l'état de chargement d'une KpiCard. */
export function KpiCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3.5 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5",
        className
      )}
    >
      <Skeleton className="h-11 w-11 rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
