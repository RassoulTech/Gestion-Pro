"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Truck, XCircle, Clock, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateEtatCommande } from "@/server/actions/commande.actions";
import { cn } from "@/lib/utils";

type Etat = "EN_ATTENTE" | "VALIDEE" | "LIVREE" | "ANNULEE";

interface EtatActionsProps {
  boutiqueId: string;
  commandeId: string;
  currentEtat: Etat;
}

const ETAT_META: Record<Etat, { label: string; icon: typeof Clock; trigger: string; option: string; toast: string }> = {
  EN_ATTENTE: {
    label: "En attente",
    icon: Clock,
    trigger: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300",
    option: "text-amber-700 dark:text-amber-300",
    toast: "Commande remise en attente",
  },
  VALIDEE: {
    label: "Validée",
    icon: CheckCircle2,
    trigger: "bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-300",
    option: "text-orange-700 dark:text-orange-300",
    toast: "Commande validée",
  },
  LIVREE: {
    label: "Livrée",
    icon: Truck,
    trigger: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
    option: "text-emerald-700 dark:text-emerald-300",
    toast: "Commande livrée",
  },
  ANNULEE: {
    label: "Annulée",
    icon: XCircle,
    trigger: "bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-300",
    option: "text-red-700 dark:text-red-300",
    toast: "Commande annulée",
  },
};

const ALL_ETATS: Etat[] = ["EN_ATTENTE", "VALIDEE", "LIVREE", "ANNULEE"];

export function EtatActions({ boutiqueId, commandeId, currentEtat }: EtatActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState<Etat>(currentEtat);

  function handleChange(nextEtat: Etat) {
    if (nextEtat === value) return;
    const previous = value;
    setValue(nextEtat); // optimistic
    startTransition(async () => {
      try {
        const result = await updateEtatCommande({
          boutiqueId,
          commandeId,
          data: { etat: nextEtat },
        });
        if (result?.serverError) {
          toast.error(result.serverError);
          setValue(previous);
          return;
        }
        toast.success(ETAT_META[nextEtat].toast);
        router.refresh();
      } catch {
        toast.error("Impossible de mettre à jour la commande.");
        setValue(previous);
      }
    });
  }

  const meta = ETAT_META[value];

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={(v) => handleChange(v as Etat)} disabled={isPending}>
        <SelectTrigger
          className={cn(
            "h-12 w-full rounded-xl border font-black uppercase tracking-wider text-xs sm:text-sm",
            meta.trigger
          )}
        >
          <span className="flex items-center gap-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>
          {ALL_ETATS.map((etat) => {
            const m = ETAT_META[etat];
            const OptionIcon = m.icon;
            return (
              <SelectItem key={etat} value={etat} className={cn("font-bold text-sm", m.option)}>
                <span className="inline-flex items-center gap-2">
                  <OptionIcon className="h-4 w-4" />
                  {m.label}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <p className="text-[11px] text-muted-foreground font-medium leading-snug">
        Tous les changements sont possibles. Passer en <strong>Annulée</strong> restocke les articles ;
        repartir d&apos;<strong>Annulée</strong> redécrémente le stock.
      </p>
    </div>
  );
}
