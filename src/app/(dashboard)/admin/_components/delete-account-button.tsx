"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteUserAccount } from "@/server/actions/admin.actions";

interface DeleteAccountButtonProps {
  userId: string;
  /** Nom affiché du compte (ex. "Awa Diop"). */
  label: string;
  email: string;
  /** Nombre de boutiques possédées (affiché dans la confirmation). */
  boutiqueCount?: number;
}

/**
 * Bouton admin de SUPPRESSION DÉFINITIVE d'un compte (mobile-first), avec
 * confirmation explicite nommant ce qui sera détruit. L'autorisation réelle est
 * vérifiée côté serveur (`deleteUserAccount` sur `adminActionClient`) ; ce bouton
 * n'est qu'un déclencheur.
 */
export function DeleteAccountButton({ userId, label, email, boutiqueCount = 0 }: DeleteAccountButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    setBusy(true);
    try {
      const res = await deleteUserAccount({ userId });
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      if (res?.validationErrors) {
        toast.error("Requête invalide.");
        return;
      }
      toast.success(`Compte de ${label} supprimé définitivement.`);
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("La suppression a échoué. Veuillez réessayer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Supprimer définitivement le compte de ${label}`}
          className="h-9 rounded-xl border-rose-200 font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/30"
        >
          <Trash2 className="h-4 w-4" />
          <span className="ml-1.5 hidden sm:inline">Supprimer</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <AlertDialogTitle className="text-center">Supprimer définitivement ce compte ?</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Le compte <strong>{label}</strong> ({email})
            {boutiqueCount > 0 ? (
              <>
                {" "}
                et {boutiqueCount > 1 ? "ses" : "sa"} <strong>{boutiqueCount} boutique{boutiqueCount > 1 ? "s" : ""}</strong>
              </>
            ) : null}{" "}
            ainsi que <strong>toutes les données associées</strong> (produits, ventes, clients,
            factures, dépenses…) seront <strong>définitivement supprimés</strong>.
            <br />
            Cette action est <strong>irréversible</strong>. L&apos;adresse e-mail redeviendra
            disponible pour une nouvelle inscription.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl" disabled={busy}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault(); // on gère la fermeture nous-mêmes (succès uniquement)
              handleDelete();
            }}
            disabled={busy}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 focus:ring-rose-600"
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Supprimer définitivement
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
