import "dotenv/config";
import prisma from "../src/utils/prisma.js";

const email = process.argv[2];

if (!email) {
  console.error("Usage: npx tsx scripts/demote-admin.ts <email>");
  process.exit(1);
}

const user = await prisma.user.findUnique({ where: { email } });

if (!user) {
  console.error(`No user found with email: ${email}`);
  await prisma.$disconnect();
  process.exit(1);
}

if (user.role !== "ADMIN") {
  console.log(`${user.username} is already a USER.`);
  await prisma.$disconnect();
  process.exit(0);
}

await prisma.user.update({ where: { email }, data: { role: "USER" } });

console.log(`Successfully demoted ${user.username} (${email}) back to USER.`);
await prisma.$disconnect();
