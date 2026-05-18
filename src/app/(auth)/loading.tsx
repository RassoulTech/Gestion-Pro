/**
 * Affiché instantanément pendant la navigation vers /login ou /register.
 * Squelette du form pour donner l'impression de rapidité.
 */
export default function AuthLoading() {
  return (
    <div className="space-y-8">
      {/* Titre */}
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
      </div>

      {/* Bouton Google */}
      <div className="h-11 w-full animate-pulse rounded-md bg-muted" />

      {/* Séparateur "ou" */}
      <div className="relative">
        <div className="h-px w-full bg-border" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
          ou avec votre email
        </span>
      </div>

      {/* Form fields */}
      <div className="space-y-5">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded-md bg-muted" />
            <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
          </div>
        ))}
        <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}
