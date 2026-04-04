import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token a heslo sú povinné." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Heslo musí mať aspoň 6 znakov." }, { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "Neplatný alebo expirovaný token." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { email: resetToken.email },
      data: { passwordHash },
    });

    // Delete used token
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Chyba pri obnove hesla." }, { status: 500 });
  }
}
