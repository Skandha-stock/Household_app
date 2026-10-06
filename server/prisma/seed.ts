import "dotenv/config";

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await prisma.activity.createMany({
    data: [
      {
        name: "Water Can",
        icon: "💧",
      },
      {
        name: "Dustbin",
        icon: "🗑️",
      },
      {
        name: "Cleaning",
        icon: "🧹",
      },
    ],
    skipDuplicates: true,
  });

  console.log("Activities seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });