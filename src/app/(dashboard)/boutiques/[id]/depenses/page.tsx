import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { DepensesClient } from "./_components/depenses-client";

interface DepensesPageProps {
  params: Promise<{ id: string }>;
}

export default async function DepensesPage({ params }: DepensesPageProps) {
  const { id: boutiqueId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const depenses = await prisma.depense.findMany({
    where: { boutiqueId },
    orderBy: { date: "desc" },
  });

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Depenses</h1>
          <p className="text-muted-foreground font-medium">Suivez vos couts operationnels et charges fixes.</p>
        </div>
        <Button asChild variant="brand" className="rounded-xl h-12 px-6 font-black shadow-lg shadow-brand/20">
          <Link href={`/boutiques/${boutiqueId}/depenses/new`}>
            <Plus className="mr-2 h-5 w-5" />
            Nouvelle Depense
          </Link>
        </Button>
      </div>

      <DepensesClient depenses={depenses} boutiqueId={boutiqueId} />
    </div>
  );
}
