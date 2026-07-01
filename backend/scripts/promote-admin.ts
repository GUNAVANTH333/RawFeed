import "dotenv/config";
import prisma from "../src/utils/prisma.js";

const email = process.argv[2];

if (!email) {
  console.error("Usage: npx tsx scripts/promote-admin.ts <email>");
  process.exit(1);
}

const user = await prisma.user.findUnique({ where: { email } });

if (!user) {
  console.error(`No user found with email: ${email}`);
  await prisma.$disconnect();
  process.exit(1);
}

if (user.role === "ADMIN") {
  console.log(`${user.username} is already an ADMIN.`);
  await prisma.$disconnect();
  process.exit(0);
}

await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });

console.log(`Successfully promoted ${user.username} (${email}) to ADMIN.`);
await prisma.$disconnect();
