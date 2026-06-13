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
 * `success`.
 *
 * @example
 *   <KpiCard label="Chiffre d'affaires" value="454 000 F CFA" icon={TrendingUp}
 *            tone="success" subtext="Sur 30j · 6 factures" accent />
 */

export type KpiTone = "brand" | "success" | "warning" | "danger" | "neutral";

const TONE: Record<KpiTone, { icon: string; accent: string }> = {
  brand: { icon: "bg-brand/10 text-brand", accent: "before:bg-brand" },
  success: { icon: "bg-success/10 text-success", accent: "before:bg-success" },
  warning: { icon: "bg-warning/10 text-warning", accent: "before:bg-warning" },
  danger: { icon: "bg-destructive/10 text-destructive", accent: "before:bg-destructive" },
  neutral: { icon: "bg-muted text-muted-foreground", accent: "before:bg-border" },
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
  className,
  children,
}: {
  href?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const base = cn(
    "group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border/60 bg-card p-4 text-card-foreground shadow-sm transition-[box-shadow,border-color] duration-200 sm:p-5",
    className
  );
  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          "cursor-pointer hover:border-brand/40 hover:shadow-md active:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        {children}
      </Link>
    );
  }
  return <div className={base}>{children}</div>;
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
      className={cn(
        accent &&
          "before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-['']",
        accent && t.accent,
        accent && "pl-5 sm:pl-6",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            t.icon
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
              trendUp
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            )}
          >
            <TrendIcon className="h-3 w-3" aria-hidden="true" />
            {Math.abs(trend.value).toFixed(1)}%
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {/* Montants jamais tronqués : on enroule si nécessaire (pas de truncate). */}
        <p className="mt-1 text-lg font-black leading-tight tracking-tight tabular-nums break-words sm:text-2xl">
          {value}
        </p>
        {(subtext || (trend && trend.label)) && (
          <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
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
        "flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:p-5",
        className
      )}
    >
      <Skeleton className="h-10 w-10 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
