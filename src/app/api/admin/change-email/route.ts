import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;

  if (!userId || !["admin", "super_admin", "editor", "support"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { newEmail, currentPassword } = await req.json();

  if (!newEmail?.trim() || !currentPassword) {
    return NextResponse.json({ error: "Vyplň všetky polia." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Používateľ neexistuje." }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Aktuálne heslo je nesprávne." }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { email: newEmail.trim() } });
  if (exists) return NextResponse.json({ error: "Tento email už je použitý." }, { status: 409 });

  await prisma.user.update({ where: { id: userId }, data: { email: newEmail.trim() } });

  return NextResponse.json({ ok: true });
}
