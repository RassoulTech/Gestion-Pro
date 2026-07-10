/** Squelette instantané des pages admin (navigation fluide, pas d'écran figé). */
export default function AdminLoading() {
  return (
    <div className="space-y-6 p-3 sm:p-6" aria-busy="true">
      <div className="h-9 w-56 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-900" />
    </div>
  );
}
