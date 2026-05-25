const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, createdAt: true } });
  console.log("All users in DB:", users);
  
  // also check what getAdvancedAnalytics would return exactly
  const date = new Date();
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  const totalUsers = await prisma.user.count({
    where: {
      createdAt: { gte: start, lte: end },
      role: { not: "ADMIN" }
    }
  });
  console.log("Total Users query (not ADMIN) this month:", totalUsers);
}

main().finally(() => prisma.$disconnect());
