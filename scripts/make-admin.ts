import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.argv[2];

async function main() {
  if (!email) {
    console.error("❌ Veuillez fournir une adresse email. Exemple : npx tsx scripts/make-admin.ts votre-email@gmail.com");
    process.exit(1);
  }

  console.log(`🔑 Tentative de passage en ADMIN pour l'utilisateur : ${email}...`);
  
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`❌ Utilisateur avec l'email "${email}" introuvable.`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });

  console.log(`✅ Succès ! L'utilisateur ${updated.name || updated.email} a maintenant le rôle : ${updated.role}`);
}

main()
  .catch((e) => {
    console.error("❌ Une erreur est survenue :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
