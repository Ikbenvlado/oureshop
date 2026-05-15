import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `OurEshop <noreply@ourstone.fun>`;

function h(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Meno, email a heslo sú povinné." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Účet s týmto emailom už existuje." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await prisma.$transaction(async (tx) => {
      let seq: number;
      do {
        seq = Math.floor(10000 + Math.random() * 90000);
      } while (await tx.user.findUnique({ where: { customerSeq: seq } }));
      return tx.user.create({
        data: { name, email, passwordHash, role: "customer", customerSeq: seq },
      });
    });

    // Notify super_admin
    try {
      const superAdmin = await prisma.user.findFirst({
        where: { role: "super_admin" },
        select: { email: true },
      });
      if (superAdmin?.email) {
        const now = new Date();
        const dateStr = `${now.getDate()}. ${now.getMonth() + 1}. ${now.getFullYear()} ${now.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" })}`;
        await resend.emails.send({
          from: FROM,
          to: superAdmin.email,
          subject: `Nový zákazník — ${name}`,
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:28px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">OurEshop</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Nová registrácia zákazníka</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <div style="width:56px;height:56px;background:#ede9fe;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <span style="font-size:24px;">👤</span>
            </div>
            <h2 style="margin:0 0 16px;font-size:18px;color:#1f2937;">Nový zákazník sa zaregistroval</h2>
            <table cellpadding="0" cellspacing="0" style="width:100%;background:#f9fafb;border-radius:10px;padding:16px;">
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#6b7280;width:80px;">Meno</td>
                <td style="padding:6px 0;font-size:13px;color:#111827;font-weight:600;">${h(name)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#6b7280;">Email</td>
                <td style="padding:6px 0;font-size:13px;color:#111827;font-weight:600;">${h(email)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#6b7280;">Čas</td>
                <td style="padding:6px 0;font-size:13px;color:#111827;">${dateStr}</td>
              </tr>
            </table>
            <div style="margin-top:24px;">
              <a href="https://oureshop.fun/admin/customers" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Zobraziť zákazníkov</a>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        });
      }
    } catch { }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Chyba pri registrácii." }, { status: 500 });
  }
}
