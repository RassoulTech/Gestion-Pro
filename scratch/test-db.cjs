const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const userCount = await prisma.user.count();
    console.log("Connection OK. User count:", userCount);
    const plans = await prisma.plan.findMany();
    console.log("Plans found:", plans.map(p => p.nom));
  } catch (e) {
    console.error("Connection failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
