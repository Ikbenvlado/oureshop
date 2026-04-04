import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { logAdminAction } from "@/lib/adminLog";

const resend = new Resend(process.env.RESEND_API_KEY);
const SHOP_NAME = "OurStone";
const FROM = `${SHOP_NAME} <noreply@ourstone.fun>`;

function approvedHtml(productName: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:28px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">${SHOP_NAME}</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Vaša recenzia bola schválená</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;text-align:center;">
            <div style="width:64px;height:64px;background:#d1fae5;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <span style="font-size:28px;">✓</span>
            </div>
            <h2 style="margin:0 0 8px;font-size:20px;color:#1f2937;">Recenzia schválená!</h2>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
              Tvoja recenzia produktu <strong>${productName}</strong> bola schválená a je teraz viditeľná pre ostatných zákazníkov.
            </p>
            <a href="https://ourstone.fun" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Prejsť do obchodu</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function rejectedHtml(productName: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:28px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">${SHOP_NAME}</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Vaša recenzia nebola schválená</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;text-align:center;">
            <h2 style="margin:0 0 8px;font-size:20px;color:#1f2937;">Recenzia zamietnutá</h2>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
              Ľutujeme, tvoja recenzia produktu <strong>${productName}</strong> nebola schválená, pretože nespĺňa naše podmienky zverejnenia.
            </p>
            <a href="https://ourstone.fun" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Prejsť do obchodu</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function getAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!["admin", "super_admin", "support"].includes(role)) return null;
  return { userId: (session!.user as any).id as string, email: session!.user!.email as string };
}

// GET — all reviews with user + product info
export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reviews = await prisma.review.findMany({
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reviews);
}

// PATCH — approve or reject
export async function PATCH(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status } = await req.json();
  if (!id || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Neplatné dáta." }, { status: 400 });
  }

  const review = await prisma.review.update({
    where: { id },
    data: { status },
    include: {
      user: { select: { email: true, name: true } },
      product: { select: { name: true } },
    },
  });

  await logAdminAction(admin.userId, admin.email, status === "approved" ? "approve" : "reject", "review", id, `${status === "approved" ? "Schválil" : "Zamietol"} recenziu produktu: ${review.product.name}`);

  await resend.emails.send({
    from: FROM,
    to: review.user.email,
    subject: status === "approved"
      ? `Tvoja recenzia bola schválená — ${SHOP_NAME}`
      : `Tvoja recenzia nebola schválená — ${SHOP_NAME}`,
    html: status === "approved"
      ? approvedHtml(review.product.name)
      : rejectedHtml(review.product.name),
  });

  return NextResponse.json(review);
}
