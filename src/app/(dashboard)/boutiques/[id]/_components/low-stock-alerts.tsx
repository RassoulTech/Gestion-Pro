import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AlertTriangle } from "lucide-react";

export async function LowStockAlerts({
  boutiqueId,
}: {
  boutiqueId: string;
}) {
  const produits = await prisma.$queryRaw<
    { id: string; nom: string; quantite: number; seuilAlerte: number }[]
  >`
    SELECT id, nom, quantite, seuil_alerte AS "seuilAlerte"
    FROM produits
    WHERE boutique_id = ${boutiqueId}
      AND quantite <= seuil_alerte
    ORDER BY quantite ASC
    LIMIT 5
  `;

  if (produits.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Aucune alerte stock. Tout est OK.
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {produits.map((p) => {
        const isOut = p.quantite === 0;
        return (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-2.5"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <AlertTriangle
                className={
                  isOut
                    ? "h-4 w-4 shrink-0 text-destructive"
                    : "h-4 w-4 shrink-0 text-amber-500"
                }
              />
              <Link
                href={`/boutiques/${boutiqueId}/produits` as `/boutiques/${string}/produits`}
                className="min-w-0 truncate text-sm hover:underline"
              >
                {p.nom}
              </Link>
            </div>
            <span
              className={
                isOut
                  ? "shrink-0 text-xs font-semibold text-destructive"
                  : "shrink-0 text-xs font-medium text-muted-foreground"
              }
            >
              {isOut ? "Rupture" : `${p.quantite} restant`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
