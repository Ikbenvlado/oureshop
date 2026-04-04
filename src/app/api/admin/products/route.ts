import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/adminLog";

async function getAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "admin" && role !== "super_admin") return null;
  return { userId: (session!.user as any).id as string, email: session!.user!.email as string };
}

export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const products = await prisma.product.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const product = await prisma.product.create({ data: body });
  await logAdminAction(admin.userId, admin.email, "create", "product", product.id, `Vytvoril produkt: ${product.name}`);
  return NextResponse.json(product);
}

export async function PUT(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, ...data } = await req.json();

  const before = await prisma.product.findUnique({ where: { id } });
  const product = await prisma.product.update({ where: { id }, data });

  const changes: string[] = [];
  if (before) {
    if (data.name !== undefined && data.name !== before.name) changes.push(`názov: "${before.name}" → "${data.name}"`);
    if (data.price !== undefined && Number(data.price) !== before.price) changes.push(`cena: ${before.price}€ → ${data.price}€`);
    if (data.discount !== undefined && Number(data.discount) !== (before.discount ?? 0)) changes.push(`zľava: ${before.discount ?? 0}% → ${data.discount}%`);
    if (data.stock !== undefined && Number(data.stock) !== before.stock) changes.push(`sklad: ${before.stock} → ${data.stock}`);
    if (data.inStock !== undefined && data.inStock !== before.inStock) changes.push(`dostupnosť: ${before.inStock ? "skladom" : "vypredané"} → ${data.inStock ? "skladom" : "vypredané"}`);
    if (data.category !== undefined && data.category !== before.category) changes.push(`kategória: "${before.category}" → "${data.category}"`);
  }
  const detail = changes.length > 0
    ? `${product.name}: ${changes.join(", ")}`
    : `Upravil produkt: ${product.name}`;

  await logAdminAction(admin.userId, admin.email, "update", "product", id, detail);
  return NextResponse.json(product);
}

export async function DELETE(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  await prisma.product.delete({ where: { id } });
  await logAdminAction(admin.userId, admin.email, "delete", "product", id, `Zmazal produkt: ${product?.name ?? id}`);
  return NextResponse.json({ ok: true });
}
