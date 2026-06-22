/**
 * Sync the `plans` table in the database with the canonical definitions in
 * src/lib/plan-limits.ts. Idempotent — safe to run on any environment.
 *
 * Usage:
 *   npx tsx scripts/sync-plans.ts
 *
 * What it does:
 *   - For each plan in PLAN_LIST, upsert by `codePlan`.
 *   - Update price, limits, trial duration, features.
 *   - Never deletes existing plans (to preserve foreign keys on abonnements).
 */
import { PrismaClient } from "@prisma/client";
import { PLAN_LIST } from "../src/lib/plan-limits";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Syncing plans with canonical definitions...");
  for (const def of PLAN_LIST) {
    const existing = await prisma.plan.findFirst({
      where: { codePlan: def.code },
    });

    const data = {
      nom: def.nom,
      prix: def.prix,
      dureeEssaiJours: def.dureeEssaiJours,
      maxBoutiques: def.maxBoutiques,
      maxProduits: def.maxProduits,
      maxMembres: def.maxMembres,
      codePlan: def.code,
      features: def.features as any,
      actif: true,
    };

    if (existing) {
      await prisma.plan.update({
        where: { id: existing.id },
        data,
      });
      console.log(
        `  ✔ Updated ${def.code}: maxProduits=${def.maxProduits}, maxBoutiques=${def.maxBoutiques}`
      );
    } else {
      await prisma.plan.create({ data });
      console.log(
        `  ✚ Created ${def.code}: maxProduits=${def.maxProduits}, maxBoutiques=${def.maxBoutiques}`
      );
    }
  }
  console.log("✅ Plans synced.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
