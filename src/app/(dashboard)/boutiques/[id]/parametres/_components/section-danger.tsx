"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { AlertTriangle, Eye, EyeOff, Loader2, PowerOff, Power, Trash2, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteBoutique,
  reactivateBoutique,
  deleteBoutiquePermanent,
  deleteVendorAccount,
} from "@/server/actions/boutique.actions";

interface Props {
  boutiqueId: string;
  boutiqueNom: string;
  boutiqueStatut: "ACTIF" | "SUSPENDU";
}

export function SectionDanger({ boutiqueId, boutiqueNom, boutiqueStatut }: Props) {
  const router = useRouter();
  const [loadingDeactivate, setLoadingDeactivate] = useState(false);
  const [deleteBoutiqueOpen, setDeleteBoutiqueOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  async function handleToggleActive() {
    const action = boutiqueStatut === "ACTIF" ? "désactiver" : "réactiver";
    if (!confirm(`Confirmez-vous vouloir ${action} la boutique « ${boutiqueNom} » ?`)) return;
    setLoadingDeactivate(true);
    try {
      const result =
        boutiqueStatut === "ACTIF"
          ? await deleteBoutique({ boutiqueId })
          : await reactivateBoutique({ boutiqueId });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success(
        boutiqueStatut === "ACTIF"
          ? "Boutique désactivée — masquée du Marketplace"
          : "Boutique réactivée"
      );
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoadingDeactivate(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30">
        <AlertTriangle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
        <p className="text-xs font-medium text-rose-800 dark:text-rose-200">
          Les actions de cette section sont sensibles et certaines sont <strong>irréversibles</strong>. Lisez attentivement avant de confirmer.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            {boutiqueStatut === "ACTIF" ? <PowerOff className="h-4 w-4 text-amber-600" /> : <Power className="h-4 w-4 text-emerald-600" />}
            {boutiqueStatut === "ACTIF" ? "Désactiver temporairement la boutique" : "Réactiver la boutique"}
          </h4>
          <p className="text-xs font-medium text-zinc-500 mt-1 leading-relaxed">
            {boutiqueStatut === "ACTIF"
              ? "Masque la boutique du Marketplace public. Vos données restent intactes et accessibles depuis le Dashboard."
              : "Réactive la boutique et la rend à nouveau visible sur le Marketplace public."}
          </p>
        </div>
        <Button
          onClick={handleToggleActive}
          disabled={loadingDeactivate}
          variant="outline"
          className={`h-11 rounded-xl font-bold text-xs shrink-0 ${
            boutiqueStatut === "ACTIF"
              ? "border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-950/20"
              : "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
          }`}
        >
          {loadingDeactivate ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {boutiqueStatut === "ACTIF" ? "Désactiver" : "Réactiver"}
        </Button>
      </div>

      <div className="rounded-2xl border-2 border-rose-200 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/10 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h4 className="text-sm font-black text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> Supprimer définitivement la boutique
          </h4>
          <p className="text-xs font-medium text-rose-700/80 dark:text-rose-300/70 mt-1 leading-relaxed">
            Supprime <strong>{boutiqueNom}</strong> et toutes ses données : produits, commandes, clients, fournisseurs, dépenses, mouvements stock. <strong>Cette action est irréversible.</strong>
          </p>
        </div>
        <Button
          onClick={() => setDeleteBoutiqueOpen(true)}
          variant="destructive"
          className="h-11 rounded-xl font-bold text-xs shrink-0"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Supprimer
        </Button>
      </div>

      <div className="rounded-2xl border-2 border-rose-200 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/10 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h4 className="text-sm font-black text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <UserMinus className="h-4 w-4" /> Supprimer définitivement mon compte vendeur
          </h4>
          <p className="text-xs font-medium text-rose-700/80 dark:text-rose-300/70 mt-1 leading-relaxed">
            Supprime votre compte, toutes vos boutiques et l&apos;ensemble des données associées. <strong>Cette action est irréversible.</strong>
          </p>
        </div>
        <Button
          onClick={() => setDeleteAccountOpen(true)}
          variant="destructive"
          className="h-11 rounded-xl font-bold text-xs shrink-0"
        >
          <UserMinus className="mr-2 h-4 w-4" /> Supprimer mon compte
        </Button>
      </div>

      <DeleteBoutiqueDialog
        open={deleteBoutiqueOpen}
        onOpenChange={setDeleteBoutiqueOpen}
        boutiqueId={boutiqueId}
        boutiqueNom={boutiqueNom}
        onDone={() => router.push("/boutiques")}
      />
      <DeleteAccountDialog
        open={deleteAccountOpen}
        onOpenChange={setDeleteAccountOpen}
      />
    </div>
  );
}

function DeleteBoutiqueDialog({
  open,
  onOpenChange,
  boutiqueId,
  boutiqueNom,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  boutiqueId: string;
  boutiqueNom: string;
  onDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await deleteBoutiquePermanent({ boutiqueId, password, confirmation });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success("Boutique supprimée définitivement");
      onOpenChange(false);
      onDone();
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-black flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-4 w-4" /> Suppression définitive
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            Vous êtes sur le point de supprimer <strong>{boutiqueNom}</strong>. Cette action est <strong>irréversible</strong>. Pour confirmer :
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Tapez <span className="font-black text-rose-600">SUPPRIMER</span> pour confirmer
            </label>
            <Input
              autoComplete="off"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-rose-500"
              placeholder="SUPPRIMER"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Votre mot de passe</label>
            <div className="relative">
              <Input
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 pr-12 font-semibold text-sm focus:ring-2 focus:ring-rose-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button type="submit" variant="destructive" disabled={loading || confirmation !== "SUPPRIMER" || !password} className="rounded-xl">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await deleteVendorAccount({ password, confirmation });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success("Compte supprimé");
      await signOut({ callbackUrl: "/" });
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-black flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-4 w-4" /> Suppression du compte
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            Cette action supprime votre compte, toutes vos boutiques et toutes les données rattachées. <strong>Elle est irréversible.</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Tapez <span className="font-black text-rose-600">SUPPRIMER</span> pour confirmer
            </label>
            <Input
              autoComplete="off"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-rose-500"
              placeholder="SUPPRIMER"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Votre mot de passe</label>
            <div className="relative">
              <Input
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 pr-12 font-semibold text-sm focus:ring-2 focus:ring-rose-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button type="submit" variant="destructive" disabled={loading || confirmation !== "SUPPRIMER" || !password} className="rounded-xl">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserMinus className="mr-2 h-4 w-4" />}
              Supprimer mon compte
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
