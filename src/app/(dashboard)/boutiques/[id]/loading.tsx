/**
 * Squelette instantané de TOUTES les pages boutique : la navigation affiche
 * immédiatement cette trame pendant que le serveur rend la page (avant, rien
 * ne bougeait à l'écran jusqu'à la réponse complète → sensation de gel).
 */
export default function BoutiqueLoading() {
  return (
    <div className="space-y-6 p-3 sm:p-6" aria-busy="true">
      <div className="flex items-center justify-between gap-4">
        <div className="h-9 w-48 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
        <div className="h-10 w-32 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-900" />
      <div className="h-48 animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-900" />
    </div>
  );
}
