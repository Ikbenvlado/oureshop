import { NextRequest, NextResponse } from "next/server";
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

  const [customers, orders] = await Promise.all([
    prisma.user.findMany({
      where: { role: "customer" },
      select: { id: true, name: true, email: true, phone: true, blocked: true, createdAt: true, customerSeq: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      select: { userId: true, customerEmail: true, total: true, status: true, id: true, date: true },
    }),
  ]);

  return NextResponse.json({ customers, orders });
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, blocked } = await req.json();
  if (!id) return NextResponse.json({ error: "Chýba ID" }, { status: 400 });
  const customer = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  await prisma.user.update({ where: { id }, data: { blocked } });
  await logAdminAction(admin.userId, admin.email, blocked ? "block" : "unblock", "customer", id, `${blocked ? "Zablokoval" : "Odblokoval"} zákazníka: ${customer?.email ?? id}`);
  return NextResponse.json({ ok: true });
}
