import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export const metadata = { title: "Plans - Admin" };

export default async function AdminPlansPage() {
  const plans = await prisma.plan.findMany({ orderBy: { prix: "asc" } });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plans</h1>
        <p className="text-sm text-muted-foreground">Gestion des offres tarifaires</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.nom}</CardTitle>
                {plan.actif ? (
                  <Badge variant="outline" className="border-emerald-500 text-emerald-700">Actif</Badge>
                ) : (
                  <Badge variant="secondary">Inactif</Badge>
                )}
              </div>
              <p className="text-3xl font-bold">{formatCurrency(plan.prix)}<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> {plan.maxBoutiques} boutique(s)</p>
              <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> {plan.maxProduits} produits max</p>
              <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> {plan.dureeEssaiJours} jours d&apos;essai</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
