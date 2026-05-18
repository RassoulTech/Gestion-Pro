import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const etatLabels: Record<string, string> = {
  EN_ATTENTE: "En attente",
  VALIDEE: "Validée",
  LIVREE: "Livrée",
  ANNULEE: "Annulée",
};

const etatVariants: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  EN_ATTENTE: "outline",
  VALIDEE: "secondary",
  LIVREE: "default",
  ANNULEE: "destructive",
};

export async function RecentOrdersList({
  boutiqueId,
}: {
  boutiqueId: string;
}) {
  const commandes = await prisma.commandeClient.findMany({
    where: { boutiqueId },
    include: { client: { select: { nom: true, prenom: true } } },
    orderBy: { date: "desc" },
    take: 5,
  });

  if (commandes.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aucune commande pour le moment.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {commandes.map((c) => (
        <li key={c.id} className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/boutiques/${boutiqueId}/commandes/${c.id}` as `/boutiques/${string}/commandes/${string}`}
              className="block truncate text-sm font-medium hover:underline"
            >
              {c.code}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {c.client
                ? `${c.client.prenom ?? ""} ${c.client.nom}`.trim()
                : "Client passage"}{" "}
              · {formatDate(c.date)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Badge variant={etatVariants[c.etat] ?? "outline"}>
              {etatLabels[c.etat] ?? c.etat}
            </Badge>
            <span className="text-sm font-medium tabular-nums">
              {formatCurrency(c.total)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
