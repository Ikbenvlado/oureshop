import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function h(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

const SHOP_NAME = "OurEshop";
const FROM = `${SHOP_NAME} <noreply@ourstone.fun>`;
const OWNER_EMAIL = "vladimirstricko@rocketmail.com";

function adminNotificationHtml(userName: string, productName: string, rating: number, comment: string) {
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
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
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Nová recenzia čaká na schválenie</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:10px 14px;background:#f8f4ff;border-radius:8px;margin-bottom:8px;">
                  <p style="margin:0;font-size:11px;color:#9333ea;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Zákazník</p>
                  <p style="margin:4px 0 0;font-size:15px;color:#1f2937;font-weight:500;">${h(userName)}</p>
                </td>
              </tr>
              <tr><td style="height:8px;"></td></tr>
              <tr>
                <td style="padding:10px 14px;background:#f8f4ff;border-radius:8px;">
                  <p style="margin:0;font-size:11px;color:#9333ea;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Produkt</p>
                  <p style="margin:4px 0 0;font-size:15px;color:#1f2937;font-weight:500;">${h(productName)}</p>
                </td>
              </tr>
              <tr><td style="height:8px;"></td></tr>
              <tr>
                <td style="padding:10px 14px;background:#f8f4ff;border-radius:8px;">
                  <p style="margin:0;font-size:11px;color:#9333ea;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Hodnotenie</p>
                  <p style="margin:4px 0 0;font-size:18px;color:#f59e0b;">${h(stars)}</p>
                </td>
              </tr>
              <tr><td style="height:8px;"></td></tr>
              <tr>
                <td style="padding:10px 14px;background:#f8f4ff;border-radius:8px;">
                  <p style="margin:0;font-size:11px;color:#9333ea;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Text recenzie</p>
                  <p style="margin:4px 0 0;font-size:15px;color:#1f2937;line-height:1.6;white-space:pre-wrap;">${h(comment)}</p>
                </td>
              </tr>
            </table>
            <div style="margin-top:24px;text-align:center;">
              <a href="https://oureshop.fun/admin/reviews" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Spravovať recenzie</a>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// GET — approved reviews for a product
export async function GET(req: NextRequest) {
  const productId = Number(req.nextUrl.searchParams.get("productId"));
  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

  const reviews = await prisma.review.findMany({
    where: { productId, status: "approved" },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reviews);
}

// POST — submit a review (auth required)
export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, rating, comment } = await req.json();
  if (!productId || !rating || !comment?.trim()) {
    return NextResponse.json({ error: "Chýbajú povinné polia." }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Hodnotenie musí byť 1–5." }, { status: 400 });
  }

  const existing = await prisma.review.findFirst({ where: { productId, userId } });
  if (existing) {
    return NextResponse.json({ error: "Recenziu si už odoslal." }, { status: 409 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Produkt neexistuje." }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const review = await prisma.review.create({
    data: { productId, userId, rating, comment: comment.trim(), status: "pending" },
  });

  await resend.emails.send({
    from: FROM,
    to: OWNER_EMAIL,
    subject: `Nová recenzia čaká na schválenie — ${SHOP_NAME}`,
    html: adminNotificationHtml(user?.name || "Zákazník", product.name, rating, comment.trim()),
  });

  return NextResponse.json(review, { status: 201 });
}
