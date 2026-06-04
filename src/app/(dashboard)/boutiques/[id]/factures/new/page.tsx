import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FilePlus2 } from "lucide-react";
import { getBoutiqueOwnerQuotas } from "@/lib/quotas";
import { getFactureFormData } from "@/server/queries/facture.queries";
import { Button } from "@/components/ui/button";
import { PremiumGuard } from "@/components/dashboard/premium-guard";
import { FactureForm } from "./_components/facture-form";

export const metadata: Metadata = { title: "Nouvelle facture" };

export default async function NouvelleFacturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [quotas, formData] = await Promise.all([
    getBoutiqueOwnerQuotas(id),
    getFactureFormData(id),
  ]);

  return (
    <div className="space-y-5 sm:space-y-6 pb-24 sm:pb-10">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="rounded-xl font-bold text-zinc-500 -ml-2">
          <Link href={`/boutiques/${id}/factures`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux factures
          </Link>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
          <FilePlus2 className="h-6 w-6 text-brand" /> Nouvelle facture
        </h1>
      </div>

      <PremiumGuard
        currentPlanName={quotas.nom}
        featureName="Factures manuelles"
        featureDescription="Émettez des factures professionnelles pour vos ventes physiques et services, avec PDF et suivi des paiements."
      >
        <FactureForm boutiqueId={id} clients={formData.clients} produits={formData.produits} />
      </PremiumGuard>
    </div>
  );
}
