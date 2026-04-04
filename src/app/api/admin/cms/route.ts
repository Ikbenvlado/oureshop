import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAccess() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  return role && ["admin", "super_admin", "editor"].includes(role);
}

export async function GET() {
  if (!await checkAccess()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pages = await prisma.page.findMany({ orderBy: { slug: "asc" } });
  return NextResponse.json({ pages });
}

export async function POST(req: Request) {
  if (!await checkAccess()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug, title, content } = await req.json();
  if (!slug || !title) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const page = await prisma.page.upsert({
    where: { slug },
    update: { title, content: content ?? "" },
    create: { slug, title, content: content ?? "" },
  });
  return NextResponse.json({ page });
}

export async function DELETE(req: Request) {
  if (!await checkAccess()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await req.json();
  await prisma.page.delete({ where: { slug } });
  return NextResponse.json({ ok: true });
}
