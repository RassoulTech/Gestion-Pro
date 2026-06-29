"use client";

import { useState, type ReactNode } from "react";

/**
 * Affiche un logo de paiement officiel depuis un asset local (public/logos/…).
 *
 * `src` accepte PLUSIEURS sources, essayées dans l'ordre (ex. SVG vectoriel puis
 * PNG), pour privilégier un rendu parfaitement net. Si toutes échouent (fichiers
 * absents), on retombe proprement sur un repli inline → jamais d'image cassée.
 *
 * `object-fit: contain` garantit que le logo n'est JAMAIS étiré ni déformé : il
 * conserve son ratio d'origine, quelle que soit la taille demandée via className.
 *
 * Déposez les fichiers officiels pour activer les vrais logos partout :
 *   public/logos/wave.svg            (ou wave.png)
 *   public/logos/orange-money.svg    (ou orange-money.png)
 */
export function PaymentLogo({
  src,
  alt,
  className,
  fallback,
}: {
  /** Une source, ou une liste essayée dans l'ordre (1re qui charge gagne). */
  src: string | string[];
  alt: string;
  className?: string;
  fallback: ReactNode;
}) {
  const sources = Array.isArray(src) ? src : [src];
  const [index, setIndex] = useState(0);

  // Toutes les sources ont échoué → repli de marque.
  if (index >= sources.length) return <>{fallback}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={sources[index]}
      src={sources[index]}
      alt={alt}
      className={className}
      style={{ objectFit: "contain" }}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}
