"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Truck, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateEtatCommande } from "@/server/actions/commande.actions";

type Etat = "EN_ATTENTE" | "VALIDEE" | "LIVREE" | "ANNULEE";

interface EtatActionsProps {
  boutiqueId: string;
  commandeId: string;
  currentEtat: Etat;
}

const TRANSITIONS: Record<Etat, Array<{ to: Etat; label: string; icon: typeof CheckCircle2; variant: "brand" | "outline" | "destructive"; toastLabel: string }>> = {
  EN_ATTENTE: [
    { to: "VALIDEE", label: "Valider", icon: CheckCircle2, variant: "brand", toastLabel: "Commande validée" },
    { to: "ANNULEE", label: "Annuler", icon: XCircle, variant: "destructive", toastLabel: "Commande annulée" },
  ],
  VALIDEE: [
    { to: "LIVREE", label: "Marquer comme livrée", icon: Truck, variant: "brand", toastLabel: "Commande livrée" },
    { to: "ANNULEE", label: "Annuler", icon: XCircle, variant: "destructive", toastLabel: "Commande annulée" },
  ],
  LIVREE: [],
  ANNULEE: [],
};

export function EtatActions({ boutiqueId, commandeId, currentEtat }: EtatActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const actions = TRANSITIONS[currentEtat];

  if (actions.length === 0) {
    return (
      <p className="text-xs text-muted-foreground font-medium">
        Cette commande est dans un état final — aucune action disponible.
      </p>
    );
  }

  function handleChange(to: Etat, toastLabel: string) {
    startTransition(async () => {
      try {
        const result = await updateEtatCommande({
          boutiqueId,
          commandeId,
          data: { etat: to },
        });

        if (result?.serverError) {
          toast.error(result.serverError);
          return;
        }

        toast.success(toastLabel);
        router.refresh();
      } catch {
        toast.error("Impossible de mettre à jour la commande.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {actions.map(({ to, label, icon: Icon, variant, toastLabel }) => (
        <Button
          key={to}
          variant={variant}
          disabled={isPending}
          onClick={() => handleChange(to, toastLabel)}
          className="w-full justify-start rounded-xl font-bold h-11"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icon className="mr-2 h-4 w-4" />
          )}
          {label}
        </Button>
      ))}
    </div>
  );
}
