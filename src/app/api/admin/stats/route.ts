import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!role || (role !== "admin" && role !== "super_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [products, orders, customerCount, adminCount] = await Promise.all([
    prisma.product.findMany({ select: { id: true, inStock: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.user.count({ where: { role: { in: ["admin", "super_admin"] } } }),
  ]);

  // Revenue by day (last 30 days)
  const now = new Date();
  const days30 = new Date(now);
  days30.setDate(days30.getDate() - 29);

  const dailyMap = new Map<string, { revenue: number; orders: number }>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(days30);
    d.setDate(d.getDate() + i);
    dailyMap.set(d.toISOString().split("T")[0], { revenue: 0, orders: 0 });
  }

  for (const o of orders) {
    if (o.status === "zrušená") continue;
    const day = (o.createdAt as Date).toISOString().split("T")[0];
    if (dailyMap.has(day)) {
      const entry = dailyMap.get(day)!;
      entry.revenue += Number(o.total);
      entry.orders += 1;
    }
  }

  const dailyStats = Array.from(dailyMap.entries()).map(([date, v]) => ({
    date: date.slice(5), // MM-DD
    revenue: Math.round(v.revenue * 100) / 100,
    orders: v.orders,
  }));

  // Top products by revenue
  const productRevenue = new Map<string, { name: string; revenue: number; qty: number }>();
  for (const o of orders) {
    if (o.status === "zrušená") continue;
    for (const item of (o as any).items) {
      const key = item.name;
      const existing = productRevenue.get(key) ?? { name: item.name, revenue: 0, qty: 0 };
      existing.revenue += Number(item.price) * item.quantity;
      existing.qty += item.quantity;
      productRevenue.set(key, existing);
    }
  }
  const topProducts = Array.from(productRevenue.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((p) => ({ ...p, revenue: Math.round(p.revenue * 100) / 100 }));

  // Average order value
  const validOrders = orders.filter((o) => o.status !== "zrušená");
  const avgOrderValue = validOrders.length > 0
    ? validOrders.reduce((sum, o) => sum + Number(o.total), 0) / validOrders.length
    : 0;

  return NextResponse.json({
    products,
    orders,
    customerCount,
    adminCount,
    dailyStats,
    topProducts,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
  });
}
