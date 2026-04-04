import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "super_admin") {
    return NextResponse.json({ error: "Nemáš oprávnenie." }, { status: 403 });
  }

  const { id, name } = await req.json();
  if (!id || !name?.trim()) {
    return NextResponse.json({ error: "ID a meno sú povinné." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id },
    data: { name: name.trim() },
  });

  return NextResponse.json({ ok: true });
}
