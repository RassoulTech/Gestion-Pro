import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { CreditCard } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";

export const metadata = { title: "Revenus - Admin" };

export default async function AdminRevenusPage() {
  const [totalRevenu, revenuMois] = await Promise.all([
    prisma.paiement.aggregate({ where: { statut: "CONFIRME" }, _sum: { montant: true } }),
    prisma.paiement.aggregate({
      where: {
        statut: "CONFIRME",
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { montant: true },
    }),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revenus</h1>
        <p className="text-sm text-muted-foreground">Suivi financier de la plateforme</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <KpiCard title="Revenu total" value={formatCurrency(totalRevenu._sum.montant ?? 0)} icon={CreditCard} />
        <KpiCard title="Revenu ce mois" value={formatCurrency(revenuMois._sum.montant ?? 0)} icon={CreditCard} />
      </div>
    </div>
  );
}
