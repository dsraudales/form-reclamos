import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    return;
  }

  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Administrador inicial",
      role: "ADMIN",
      active: true,
      passwordHash: await argon2.hash(password, { type: argon2.argon2id })
    }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async () => {
    await prisma.$disconnect();
    process.exit(1);
  });
