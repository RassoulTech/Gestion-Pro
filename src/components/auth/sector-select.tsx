"use client";

import * as React from "react";
import {
  Check,
  ChevronDown,
  Search,
  Utensils,
  Shirt,
  Smartphone,
  Sparkles,
  HeartPulse,
  Store,
  Hammer,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SECTORS = [
  { value: "ALIMENTATION", icon: Utensils },
  { value: "HABILLEMENT", icon: Shirt },
  { value: "ELECTRONIQUE", icon: Smartphone },
  { value: "BEAUTE", icon: Sparkles },
  { value: "SANTE", icon: HeartPulse },
  { value: "SERVICES", icon: Store },
  { value: "QUINCAILLERIE", icon: Hammer },
  { value: "LIBRAIRIE", icon: BookOpen },
  { value: "AUTRE", icon: HelpCircle },
] as const;

interface SectorSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Sélecteur de secteur d'activité premium (mobile-first) : combobox recherchable
 * (Popover), items spacieux avec icône, option active mise en valeur, largeur
 * alignée sur le déclencheur (ne déborde pas sur mobile). Valeur de sortie =
 * l'enum secteur, identique au `<Select>` d'origine.
 */
export function SectorSelect({ value, onValueChange, placeholder, className }: SectorSelectProps) {
  const tm = useTranslations("marketplace");
  const tw = useTranslations("auth.wizard");
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  // Navigation clavier : index surligné, piloté par ↑/↓, validé par Entrée.
  const [highlight, setHighlight] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  const selected = SECTORS.find((s) => s.value === value);
  const filtered = SECTORS.filter((s) =>
    tm(`secteurs.${s.value}`).toLowerCase().includes(query.trim().toLowerCase()),
  );

  React.useEffect(() => setHighlight(0), [query, open]);

  function pick(v: string) {
    onValueChange(v);
    setOpen(false);
    setQuery("");
  }

  function onSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next =
        e.key === "ArrowDown"
          ? Math.min(highlight + 1, filtered.length - 1)
          : Math.max(highlight - 1, 0);
      setHighlight(next);
      listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[highlight];
      if (opt) pick(opt.value);
    }
    // Échap : fermeture native du Popover (Radix).
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-xl bg-foreground/5 px-4 text-sm font-bold transition-all hover:bg-foreground/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            {selected ? (
              <>
                <selected.icon className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">{tm(`secteurs.${selected.value}`)}</span>
              </>
            ) : (
              <span className="truncate text-muted-foreground">{placeholder ?? tw("sectorPlaceholder")}</span>
            )}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-2xl border border-border/60 bg-popover p-0 shadow-2xl"
      >
        <div className="border-b border-border/60 p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tw("sectorSearch")}
              onKeyDown={onSearchKeyDown}
              role="listbox"
              aria-activedescendant={filtered[highlight] ? `sector-${filtered[highlight].value}` : undefined}
              className="h-10 rounded-xl border-none bg-foreground/5 pl-9 text-sm font-bold focus-visible:ring-1 focus-visible:ring-brand"
              autoFocus
            />
          </div>
        </div>
        <div ref={listRef} className="max-h-64 overflow-y-auto overscroll-contain p-1.5">
          {filtered.length > 0 ? (
            filtered.map((s, i) => {
              const Icon = s.icon;
              const active = s.value === value;
              const highlighted = i === highlight;
              return (
                <button
                  key={s.value}
                  id={`sector-${s.value}`}
                  type="button"
                  onClick={() => pick(s.value)}
                  onMouseEnter={() => setHighlight(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition-colors active:scale-[0.99]",
                    active ? "bg-brand/10 text-brand" : "text-foreground",
                    highlighted && !active && "bg-foreground/5",
                    highlighted && active && "ring-1 ring-brand/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                      active ? "bg-brand/15 text-brand" : "bg-foreground/5 text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 truncate">{tm(`secteurs.${s.value}`)}</span>
                  {active && <Check className="h-4 w-4 shrink-0 text-brand" strokeWidth={3} />}
                </button>
              );
            })
          ) : (
            <p className="px-3 py-6 text-center text-xs font-semibold text-muted-foreground">
              {tw("sectorNoResult")}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
