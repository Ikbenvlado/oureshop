import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/adminLog";

async function getAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!["admin", "super_admin", "support"].includes(role)) return null;
  return { userId: (session!.user as any).id as string, email: session!.user!.email as string };
}

export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { customerName, customerEmail, address, items, notes } = body;
  if (!customerName || !customerEmail || !items?.length) return NextResponse.json({ error: "Chýbajú povinné polia" }, { status: 400 });
  const total = items.reduce((sum: number, i: any) => sum + Number(i.price) * i.quantity, 0);
  const orderId = `ORD-${Date.now()}`;
  const order = await prisma.order.create({
    data: {
      id: orderId, customerName, customerEmail, address: address || "—", total,
      status: "nová", date: new Date().toISOString().split("T")[0], notes: notes || null,
      items: { create: items.map((i: any) => ({ name: i.name, price: Number(i.price), quantity: i.quantity })) },
    },
    include: { items: true },
  });
  await logAdminAction(admin.userId, admin.email, "create", "order", orderId, `Vytvoril objednávku pre ${customerName}`);
  return NextResponse.json(order);
}

export async function PATCH(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, status, notes } = await req.json();
  if (!id) return NextResponse.json({ error: "Chýba ID" }, { status: 400 });

  const before = await prisma.order.findUnique({ where: { id }, select: { status: true, notes: true, customerName: true } });
  const data: any = {};
  if (status !== undefined) data.status = status;
  if (notes !== undefined) data.notes = notes;
  await prisma.order.update({ where: { id }, data });

  if (status !== undefined) {
    const detail = `${before?.customerName ?? id}: stav ${before?.status ?? "?"} → ${status}`;
    await logAdminAction(admin.userId, admin.email, "update", "order", id, detail);
  }
  if (notes !== undefined && status === undefined) {
    const preview = notes ? `"${notes.slice(0, 60)}${notes.length > 60 ? "…" : ""}"` : "(poznámka zmazaná)";
    await logAdminAction(admin.userId, admin.email, "note", "order", id, `Poznámka k ${before?.customerName ?? id}: ${preview}`);
  }
  return NextResponse.json({ ok: true });
}
