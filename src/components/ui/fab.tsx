"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating Action Button premium avec speed-dial.
 *
 * Présentation pure (liens vers des routes existantes). Aucune logique métier.
 * Position fixe responsive, scrim au clic, animations légères et accessibles.
 */

export type FabActionTone = "brand" | "success" | "danger" | "neutral";

export interface FabAction {
  label: string;
  href: string;
  icon: LucideIcon;
  tone?: FabActionTone;
}

const ACTION_TONE: Record<FabActionTone, string> = {
  brand: "bg-brand/10 text-brand",
  success: "bg-success/10 text-success",
  danger: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
};

export function Fab({
  actions,
  className,
  label = "Actions rapides",
}: {
  actions: FabAction[];
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {/* Scrim : ferme au clic, voile léger pour focaliser sur les actions. */}
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            aria-label="Fermer le menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-foreground/20 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      <div
        className={cn(
          // Au-dessus du bottom-nav mobile, plus serré sur desktop.
          "fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8",
          className
        )}
      >
        <AnimatePresence>
          {open && (
            <motion.ul
              className="flex flex-col items-end gap-3"
              initial="closed"
              animate="open"
              exit="closed"
              variants={{
                open: { transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
                closed: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
              }}
            >
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <motion.li
                    key={action.href}
                    variants={{
                      open: { opacity: 1, y: 0, scale: 1 },
                      closed: { opacity: 0, y: 12, scale: 0.9 },
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Link
                      href={action.href}
                      onClick={() => setOpen(false)}
                      className="group flex items-center gap-3"
                    >
                      <span className="rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-md">
                        {action.label}
                      </span>
                      <span
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-lg ring-1 ring-border/60 transition-transform duration-200 group-hover:scale-110 group-active:scale-95",
                          ACTION_TONE[action.tone ?? "brand"]
                        )}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2.25} />
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          aria-label={label}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          whileTap={{ scale: 0.92 }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand to-orange-600 text-white shadow-xl shadow-brand/30 ring-1 ring-white/20 transition-shadow hover:shadow-2xl hover:shadow-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
            <Plus className="h-7 w-7" strokeWidth={2.5} />
          </motion.span>
        </motion.button>
      </div>
    </>
  );
}
