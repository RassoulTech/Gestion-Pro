import type { FactureStatut } from "@/schemas/facture.schema";

/** Libellés + classes Tailwind partagés entre la liste, le détail et le PDF. */
export const FACTURE_STATUT_CONFIG: Record<
  FactureStatut,
  { label: string; badge: string; dot: string }
> = {
  BROUILLON: {
    label: "Brouillon",
    badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    dot: "bg-zinc-400",
  },
  PAYEE: {
    label: "Payée",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  IMPAYEE: {
    label: "Impayée",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  ANNULEE: {
    label: "Annulée",
    badge: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    dot: "bg-red-500",
  },
};

export const FACTURE_STATUTS_ORDER: FactureStatut[] = [
  "BROUILLON",
  "PAYEE",
  "IMPAYEE",
  "ANNULEE",
];
