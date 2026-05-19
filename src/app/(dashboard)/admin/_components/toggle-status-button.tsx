"use client";

import { useTransition } from "react";
import { toggleVendeurStatut, toggleBoutiqueStatut } from "@/server/actions/admin.actions";
import { Button } from "@/components/ui/button";
import { Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner toast is available or standard toast

interface ToggleStatusButtonProps {
  id: string;
  currentStatut: "ACTIF" | "SUSPENDU";
  type: "vendeur" | "boutique";
}

export function ToggleStatusButton({ id, currentStatut, type }: ToggleStatusButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        if (type === "vendeur") {
          const res = await toggleVendeurStatut({ vendeurId: id });
          if (res?.data?.success) {
            toast.success(`Statut du vendeur mis à jour : ${res.data.newStatut}`);
          } else {
            toast.error("Une erreur est survenue lors de la mise à jour.");
          }
        } else {
          const res = await toggleBoutiqueStatut({ boutiqueId: id });
          if (res?.data?.success) {
            toast.success(`Statut de la boutique mis à jour : ${res.data.newStatut}`);
          } else {
            toast.error("Une erreur est survenue lors de la mise à jour.");
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur de traitement.";
        toast.error(message);
      }
    });
  };

  const isActif = currentStatut === "ACTIF";

  return (
    <Button
      variant={isActif ? "destructive" : "default"}
      size="sm"
      className="h-8 gap-1 text-xs"
      disabled={isPending}
      onClick={handleToggle}
    >
      {isPending ? (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : isActif ? (
        <Ban className="h-3.5 w-3.5" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5" />
      )}
      {isActif ? "Suspendre" : "Activer"}
    </Button>
  );
}
