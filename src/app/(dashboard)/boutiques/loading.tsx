/** Squelettes de chargement de la page « Mes boutiques » (portefeuille). */
export default function BoutiquesLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-4 sm:px-6 sm:py-8" aria-busy="true">
      <div className="h-64 animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-900 sm:rounded-[2rem]" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-[2rem] bg-zinc-100 dark:bg-zinc-900" />
        ))}
      </div>
    </div>
  );
}
