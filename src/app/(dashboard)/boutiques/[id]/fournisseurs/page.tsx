import { Suspense } from "react";
import { getBoutiqueFournisseurs } from "@/server/queries/fournisseur.queries";
import { TableSkeleton } from "@/components/loading";
import { FournisseursClient } from "./_components/fournisseurs-client";

export const metadata = { title: "Fournisseurs" };

async function FournisseursContent({ boutiqueId }: { boutiqueId: string }) {
  const fournisseurs = await getBoutiqueFournisseurs(boutiqueId);
  return <FournisseursClient fournisseurs={fournisseurs.data} boutiqueId={boutiqueId} total={fournisseurs.total} />;
}

export default async function FournisseursPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Fournisseurs</h1>
        <p className="text-muted-foreground font-medium">Gérez vos fournisseurs et vos achats</p>
      </div>
      <Suspense fallback={<TableSkeleton />}>
        <FournisseursContent boutiqueId={id} />
      </Suspense>
    </div>
  );
}
