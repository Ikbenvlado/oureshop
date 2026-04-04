import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/adminLog";

async function getAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!["admin", "super_admin", "editor"].includes(role)) return null;
  return { userId: (session!.user as any).id as string, email: session!.user!.email as string };
}

export async function GET() {
  if (!await getAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ coupons });
}

export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { code, type, value, minOrder, maxUses, expiresAt } = body;
  if (!code || !type || value == null) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  try {
    const coupon = await prisma.coupon.create({
      data: { code: code.toUpperCase().trim(), type, value: Number(value), minOrder: Number(minOrder ?? 0), maxUses: maxUses ? Number(maxUses) : null, expiresAt: expiresAt ? new Date(expiresAt) : null },
    });
    await logAdminAction(admin.userId, admin.email, "create", "coupon", coupon.id, `Vytvoril kupón: ${coupon.code}`);
    return NextResponse.json({ coupon });
  } catch {
    return NextResponse.json({ error: "Code already exists" }, { status: 409 });
  }
}

export async function PATCH(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const before = await prisma.coupon.findUnique({ where: { id } });
  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      ...(data.active !== undefined && { active: data.active }),
      ...(data.code && { code: data.code.toUpperCase().trim() }),
      ...(data.type && { type: data.type }),
      ...(data.value !== undefined && { value: Number(data.value) }),
      ...(data.minOrder !== undefined && { minOrder: Number(data.minOrder) }),
      ...(data.maxUses !== undefined && { maxUses: data.maxUses ? Number(data.maxUses) : null }),
      ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }),
    },
  });

  let detail: string;
  if (data.active !== undefined) {
    detail = `${data.active ? "Aktivoval" : "Deaktivoval"} kupón: ${coupon.code}`;
  } else if (before) {
    const changes: string[] = [];
    if (data.value !== undefined && Number(data.value) !== before.value) changes.push(`hodnota: ${before.value} → ${data.value}`);
    if (data.minOrder !== undefined && Number(data.minOrder) !== before.minOrder) changes.push(`min. objednávka: ${before.minOrder}€ → ${data.minOrder}€`);
    if (data.maxUses !== undefined && data.maxUses !== before.maxUses) changes.push(`max. použití: ${before.maxUses ?? "∞"} → ${data.maxUses ?? "∞"}`);
    if (data.type && data.type !== before.type) changes.push(`typ: ${before.type} → ${data.type}`);
    detail = changes.length > 0 ? `${coupon.code}: ${changes.join(", ")}` : `Upravil kupón: ${coupon.code}`;
  } else {
    detail = `Upravil kupón: ${coupon.code}`;
  }

  await logAdminAction(admin.userId, admin.email, data.active !== undefined ? "toggle" : "update", "coupon", id, detail);
  return NextResponse.json({ coupon });
}

export async function DELETE(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  const coupon = await prisma.coupon.findUnique({ where: { id }, select: { code: true } });
  await prisma.coupon.delete({ where: { id } });
  await logAdminAction(admin.userId, admin.email, "delete", "coupon", id, `Zmazal kupón: ${coupon?.code ?? id}`);
  return NextResponse.json({ ok: true });
}
