import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.paiement.deleteMany({});
  console.log('Deleted all test payments');
}

main().finally(() => prisma.$disconnect());
