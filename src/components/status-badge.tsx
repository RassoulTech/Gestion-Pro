








import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  // Commande states
  EN_ATTENTE: { label: "En attente", variant: "outline" as const, className: "border-yellow-500 text-yellow-700 dark:text-yellow-400" },
  VALIDEE: { label: "Validée", variant: "outline" as const, className: "border-orange-500 text-orange-700 dark:text-orange-400" },
  LIVREE: { label: "Livrée", variant: "outline" as const, className: "border-emerald-500 text-emerald-700 dark:text-emerald-400" },
  ANNULEE: { label: "Annulée", variant: "outline" as const, className: "border-red-500 text-red-700 dark:text-red-400" },
  // Vendeur / Boutique statut
  ACTIF: { label: "Actif", variant: "outline" as const, className: "border-emerald-500 text-emerald-700 dark:text-emerald-400" },
  SUSPENDU: { label: "Suspendu", variant: "outline" as const, className: "border-red-500 text-red-700 dark:text-red-400" },
  // Abonnement
  ESSAI: { label: "Essai", variant: "outline" as const, className: "border-zinc-500 text-zinc-700 dark:text-zinc-400" },
  EXPIRE: { label: "Expiré", variant: "outline" as const, className: "border-gray-500 text-gray-700 dark:text-gray-400" },
  ANNULE: { label: "Annulé", variant: "outline" as const, className: "border-red-500 text-red-700 dark:text-red-400" },
  // Paiement
  CONFIRME: { label: "Confirmé", variant: "outline" as const, className: "border-emerald-500 text-emerald-700 dark:text-emerald-400" },
  ECHOUE: { label: "Échoué", variant: "outline" as const, className: "border-red-500 text-red-700 dark:text-red-400" },
  REMBOURSE: { label: "Remboursé", variant: "outline" as const, className: "border-zinc-400 text-zinc-600 dark:text-zinc-400" },
  // Stock
  ENTREE: { label: "Entrée", variant: "outline" as const, className: "border-emerald-500 text-emerald-700 dark:text-emerald-400" },
  SORTIE: { label: "Sortie", variant: "outline" as const, className: "border-red-500 text-red-700 dark:text-red-400" },
  // Roles
  OWNER: { label: "Propriétaire", variant: "default" as const, className: "" },
  STAFF: { label: "Staff", variant: "secondary" as const, className: "" },
} as const;

type StatusKey = keyof typeof statusConfig;

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as StatusKey];

  if (!config) {
    return <Badge variant="outline">{status}</Badge>;
  }

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
