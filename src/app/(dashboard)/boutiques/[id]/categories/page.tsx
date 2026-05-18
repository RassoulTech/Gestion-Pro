import { Suspense } from "react";
import { getBoutiqueCategories } from "@/server/queries/categorie.queries";
import { CategoriesClient } from "./_components/categories-client";
import { TableSkeleton } from "@/components/loading";

export const metadata = { title: "Catégories" };

async function CategoriesContent({ boutiqueId }: { boutiqueId: string }) {
  const categories = await getBoutiqueCategories(boutiqueId);
  return <CategoriesClient categories={categories} boutiqueId={boutiqueId} />;
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Catégories</h1>
        <p className="text-muted-foreground font-medium">
          Organisez vos produits par catégorie
        </p>
      </div>
      <Suspense fallback={<TableSkeleton />}>
        <CategoriesContent boutiqueId={id} />
      </Suspense>
    </div>
  );
}
