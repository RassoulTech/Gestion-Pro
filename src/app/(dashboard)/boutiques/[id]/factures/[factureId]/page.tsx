import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getFactureById } from "@/server/queries/facture.queries";
import { Button } from "@/components/ui/button";
import { FactureDetail } from "./_components/facture-detail";

export const metadata: Metadata = { title: "Facture" };

export default async function FactureDetailPage({
  params,
}: {
  params: Promise<{ id: string; factureId: string }>;
}) {
  const { id, factureId } = await params;
  const facture = await getFactureById(id, factureId);
  if (!facture) notFound();

  return (
    <div className="space-y-5 pb-24 sm:pb-10">
      <Button asChild variant="ghost" size="sm" className="rounded-xl font-bold text-zinc-500 -ml-2">
        <Link href={`/boutiques/${id}/factures`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux factures
        </Link>
      </Button>

      <FactureDetail
        boutiqueId={id}
        facture={{
          id: facture.id,
          numero: facture.numero,
          date: facture.date.toISOString(),
          statut: facture.statut,
          clientNom: facture.clientNom,
          clientTelephone: facture.clientTelephone,
          clientEmail: facture.clientEmail,
          clientAdresse: facture.clientAdresse,
          sousTotal: facture.sousTotal,
          remise: facture.remise,
          tauxTva: facture.tauxTva,
          montantTva: facture.montantTva,
          total: facture.total,
          stockDeduit: facture.stockDeduit,
          notes: facture.notes,
          lignes: facture.lignes.map((l) => ({
            id: l.id,
            designation: l.designation,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
          })),
          boutique: facture.boutique,
        }}
      />
    </div>
  );
}
