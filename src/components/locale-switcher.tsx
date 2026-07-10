"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Globe, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  locales,
  localeFlags,
  localeNames,
  LOCALE_COOKIE,
  type Locale,
} from "@/i18n/config";

interface LocaleSwitcherProps {
  /** Classe appliquée au bouton déclencheur (taille/forme selon le contexte). */
  className?: string;
  /** Affiche le libellé de la langue à côté de l'icône (header desktop). */
  withLabel?: boolean;
}

/**
 * Sélecteur de langue (FR/EN, extensible). Persiste le choix dans un cookie via
 * une action serveur — sans jamais toucher à l'URL ni aux paramètres : on
 * rafraîchit juste le rendu serveur pour relire le cookie.
 */
export function LocaleSwitcher({ className, withLabel = false }: LocaleSwitcherProps) {
  const t = useTranslations("localeSwitcher");
  const activeLocale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function onSelect(next: Locale) {
    if (next === activeLocale) return;
    // ⚡ Perf : le cookie est posé CÔTÉ CLIENT (il n'est pas httpOnly) puis un
    // SEUL rafraîchissement serveur relit la langue. Avant : action serveur
    // (aller-retour n°1) PUIS router.refresh() (aller-retour n°2) en série —
    // le temps de bascule était doublé.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={withLabel ? "default" : "icon"}
          aria-label={t("select")}
          className={cn(
            "text-muted-foreground hover:text-foreground gap-2",
            !withLabel && "h-9 w-9",
            className,
          )}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          {withLabel && (
            <span className="text-sm font-semibold uppercase">{activeLocale}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t("label")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {locales.map((loc) => {
          const active = loc === activeLocale;
          return (
            <DropdownMenuItem
              key={loc}
              onSelect={(e) => {
                e.preventDefault();
                onSelect(loc);
              }}
              className="cursor-pointer gap-2.5 font-semibold"
            >
              <span aria-hidden className="text-base leading-none">
                {localeFlags[loc]}
              </span>
              <span className="flex-1">{localeNames[loc]}</span>
              {active && <Check className="h-4 w-4 text-brand" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
