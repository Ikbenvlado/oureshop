import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function generateUniqueSeq(used: Set<number>): Promise<number> {
  let seq: number;
  do {
    seq = Math.floor(10000 + Math.random() * 90000);
  } while (used.has(seq));
  used.add(seq);
  return seq;
}

async function main() {
  // Collect already-used numbers
  const existing = await prisma.user.findMany({
    where: { customerSeq: { not: null } },
    select: { customerSeq: true },
  });
  const used = new Set(existing.map((u) => u.customerSeq!));

  // Re-assign ALL customers with random numbers
  const users = await prisma.user.findMany({
    where: { role: "customer" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  for (const u of users) {
    const seq = await generateUniqueSeq(used);
    await prisma.user.update({ where: { id: u.id }, data: { customerSeq: seq } });
  }

  console.log(`Hotovo. Pridelených náhodných čísel: ${users.length}`);
  await prisma.$disconnect();
}

main();
