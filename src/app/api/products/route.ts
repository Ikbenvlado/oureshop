import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const category = searchParams.get("category");
  const excludeId = searchParams.get("excludeId");
  const limit = searchParams.get("limit");

  if (id) {
    const product = await prisma.product.findUnique({ where: { id: Number(id) } });
    return NextResponse.json(product);
  }

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (excludeId) where.NOT = { id: Number(excludeId) };

  const products = await prisma.product.findMany({
    where,
    orderBy: { id: "asc" },
    ...(limit ? { take: Number(limit) } : {}),
  });

  return NextResponse.json(products);
}
