import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logAdminAction } from "@/lib/adminLog";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "super_admin") {
    return NextResponse.json({ error: "Nemáš oprávnenie vytvárať adminov." }, { status: 403 });
  }
  const adminUserId = (session.user as any).id as string;
  const adminEmail = session.user!.email as string;

  const { email, password, name, role } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email a heslo sú povinné." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Heslo musí mať aspoň 6 znakov." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Účet s týmto emailom už existuje." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const newUser = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name?.trim() || email.split("@")[0],
      role: role ?? "admin",
    },
  });

  await logAdminAction(adminUserId, adminEmail, "create", "admin", newUser.id, `Vytvoril používateľa: ${email} (${role ?? "admin"})`);

  return NextResponse.json({ ok: true });
}
