import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      date: true,
      total: true,
      status: true,
      items: { select: { name: true, price: true, quantity: true } },
    },
  });

  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json();

  const { orderId, items, total, status, date, customerName, customerEmail, address, couponId } = body;

  const [order] = await Promise.all([
    prisma.order.create({
      data: {
        id: orderId,
        userId: session?.user?.id ?? null,
        customerName,
        customerEmail,
        address,
        total,
        status,
        date,
        items: {
          create: items.map((item: { name: string; price: number; quantity: number }) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
    }),
    couponId
      ? prisma.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } }).catch(() => {})
      : Promise.resolve(),
  ]);

  return NextResponse.json({ id: order.id });
}
