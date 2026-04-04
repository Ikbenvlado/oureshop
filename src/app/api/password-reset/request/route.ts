import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email je povinný." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({ ok: true });
    }

    // Delete any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email } });

    // Create new token (valid for 1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const baseUrl = process.env.AUTH_URL || "https://ourstone.fun";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await resend.emails.send({
      from: "OurStone <noreply@ourstone.fun>",
      to: email,
      subject: "Obnovenie hesla — OurStone",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:24px">OurStone</h1>
          </div>
          <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <p>Dobrý deň,</p>
            <p>Niekto požiadal o obnovenie hesla pre váš účet. Kliknite na tlačidlo nižšie:</p>
            <div style="text-align:center;margin:24px 0">
              <a href="${resetUrl}" style="background:#7c3aed;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600">
                Obnoviť heslo
              </a>
            </div>
            <p style="color:#6b7280;font-size:14px">Ak ste o obnovu hesla nežiadali, tento email ignorujte. Link je platný 1 hodinu.</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Chyba pri odosielaní emailu." }, { status: 500 });
  }
}
