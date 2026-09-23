import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);

const prisma = new PrismaClient({
  adapter,
});

async function main(): Promise<void> {
  await prisma.activity.upsert({
    where: { name: "Water Can" },
    update: { icon: "💧" },
    create: {
      name: "Water Can",
      icon: "💧",
    },
  });

  await prisma.activity.upsert({
    where: { name: "Dustbin" },
    update: { icon: "🗑️" },
    create: {
      name: "Dustbin",
      icon: "🗑️",
    },
  });

  await prisma.activity.upsert({
    where: { name: "Cleaning" },
    update: { icon: "🧹" },
    create: {
      name: "Cleaning",
      icon: "🧹",
    },
  });

  console.log("Activities seeded successfully.");
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });