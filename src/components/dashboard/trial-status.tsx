import Link from "next/link";
import { Clock, Lock, Sparkles, LifeBuoy, User } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ÉCRAN DE FIN D'ESSAI — rendu CÔTÉ SERVEUR par le layout boutique à la place
 * du contenu : toutes les pages de gestion sont bloquées tant qu'aucun forfait
 * payant n'est actif. Les données restent intactes ; la souscription redonne
 * l'accès immédiatement. Le vendeur garde : forfaits (/pricing), profil,
 * support (widget monté par le layout).
 */
export function TrialExpiredScreen({ boutiqueId }: { boutiqueId: string }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-black tracking-tight">
          Votre période d&apos;essai de 15 jours est terminée
        </h1>
        <p className="mt-3 text-sm font-medium leading-relaxed text-muted-foreground">
          Votre boutique, vos produits et votre historique sont <strong className="text-foreground">conservés intacts</strong>.
          Souscrivez un forfait pour retrouver immédiatement l&apos;accès complet à votre espace de gestion.
        </p>

        <div className="mt-7 space-y-2.5">
          <Button asChild size="xl" variant="brand" className="h-13 w-full rounded-2xl font-black shadow-lg shadow-brand/20">
            <Link href={`/pricing?boutiqueId=${boutiqueId}`}>
              <Sparkles className="mr-2 h-5 w-5" /> Voir les forfaits
            </Link>
          </Button>
          <div className="grid grid-cols-2 gap-2.5">
            <Button asChild variant="outline" className="h-11 rounded-xl font-bold">
              <Link href="/profil"><User className="mr-1.5 h-4 w-4" /> Mon profil</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-xl font-bold">
              <Link href="/contact"><LifeBuoy className="mr-1.5 h-4 w-4" /> Support</Link>
            </Button>
          </div>
        </div>

        <p className="mt-6 text-[11px] font-semibold text-muted-foreground">
          Une question ? Le bouton « Aide &amp; suggestions » reste disponible en bas de l&apos;écran.
        </p>
      </div>
    </div>
  );
}

/**
 * Indicateur du temps d'essai restant — discret en début d'essai, nettement
 * plus visible dans les 3 derniers jours.
 */
export function TrialBanner({ daysLeft }: { daysLeft: number }) {
  const urgent = daysLeft <= 3;
  if (!urgent) {
    return (
      <div className="mx-3 mt-3 sm:mx-6 sm:mt-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-bold text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-brand" />
          Essai : {daysLeft} jour{daysLeft > 1 ? "s" : ""} restant{daysLeft > 1 ? "s" : ""}
        </span>
      </div>
    );
  }
  return (
    <div className="mx-3 mt-3 sm:mx-6 sm:mt-4">
      <div className="flex flex-col gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-400">
          <Clock className="h-4 w-4 shrink-0" />
          {daysLeft <= 0
            ? "Dernier jour d'essai — votre accès sera bloqué ce soir."
            : `Plus que ${daysLeft} jour${daysLeft > 1 ? "s" : ""} d'essai — passez à un forfait pour ne rien interrompre.`}
        </p>
        <Button asChild size="sm" variant="brand" className="h-9 rounded-xl px-4 text-xs font-black">
          <Link href="/pricing">Choisir un forfait</Link>
        </Button>
      </div>
    </div>
  );
}
