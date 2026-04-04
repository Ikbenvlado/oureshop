import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const withProducts = searchParams.get("withProducts") === "true";

  if (withProducts) {
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: { product: true },
    });
    return NextResponse.json(favorites.map((f) => f.product));
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    select: { productId: true },
  });

  return NextResponse.json(favorites.map((f) => f.productId));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await req.json();

  // Toggle: if exists, remove; if not, add
  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed" });
  }

  await prisma.favorite.create({
    data: { userId: session.user.id, productId },
  });

  return NextResponse.json({ action: "added" });
}
