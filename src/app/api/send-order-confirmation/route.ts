import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function h(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

const SHOP_NAME = "OurEshop";
const FROM = `${SHOP_NAME} <objednavky@oureshop.fun>`;
const OWNER_EMAIL = "vladimirstricko@rocketmail.com";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

function customerHtml(
  name: string,
  orderId: string,
  items: OrderItem[],
  shipping: number,
  total: number,
  address: string,
  phone: string,
  payment: string,
  lang: string
) {
  const en = lang === "en";
  const paymentLabel = en
    ? payment === "card" ? "Credit card" : payment === "transfer" ? "Bank transfer" : "Cash on delivery"
    : payment === "card" ? "Platobná karta" : payment === "transfer" ? "Bankový prevod" : "Dobierka";

  const itemsRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">
          ${h(item.name)} <span style="color:#9ca3af;">× ${Number(item.quantity)}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;font-weight:600;text-align:right;white-space:nowrap;">
          ${(item.price * item.quantity).toFixed(2)} €
        </td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(124,58,237,0.1);">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#ec4899);padding:32px;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">${SHOP_NAME}</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${en ? "Order Confirmation" : "Potvrdenie objednávky"}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 0;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="width:64px;height:64px;background:#f0fdf4;border-radius:50%;margin:0 auto 16px;line-height:64px;font-size:32px;">✅</div>
              <h2 style="margin:0 0 8px;font-size:22px;color:#111827;font-weight:800;">${en ? "Order received!" : "Objednávka prijatá!"}</h2>
              <p style="margin:0;font-size:15px;color:#6b7280;">${en ? "Thank you," : "Ďakujeme,"} <strong style="color:#111827;">${h(name)}</strong>!</p>
              <p style="margin:6px 0 0;font-size:13px;color:#9ca3af;font-family:monospace;">${h(orderId)}</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:1px;">${en ? "Items" : "Položky"}</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${itemsRows}
              <tr>
                <td style="padding:10px 0;font-size:13px;color:#9ca3af;">${en ? "Shipping" : "Doprava"}</td>
                <td style="padding:10px 0;font-size:13px;color:${shipping === 0 ? "#16a34a" : "#9ca3af"};text-align:right;font-weight:600;">
                  ${shipping === 0 ? (en ? "Free" : "Zadarmo") : `${shipping.toFixed(2)} €`}
                </td>
              </tr>
              <tr>
                <td style="padding:14px 0 0;font-size:16px;font-weight:800;color:#111827;border-top:2px solid #f3f4f6;">${en ? "Total" : "Celkom"}</td>
                <td style="padding:14px 0 0;font-size:18px;font-weight:800;color:#7c3aed;text-align:right;border-top:2px solid #f3f4f6;">${total.toFixed(2)} €</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf5ff;border-radius:10px;padding:16px;">
              <tr><td style="padding:6px 16px;">
                <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;">${en ? "Delivery address" : "Doručovacia adresa"}</p>
                <p style="margin:3px 0 0;font-size:14px;color:#374151;">${h(address)}</p>
              </td></tr>
              <tr><td style="padding:6px 16px;">
                <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;">${en ? "Phone" : "Telefón"}</p>
                <p style="margin:3px 0 0;font-size:14px;color:#374151;">${h(phone)}</p>
              </td></tr>
              <tr><td style="padding:6px 16px;">
                <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;">${en ? "Payment method" : "Spôsob platby"}</p>
                <p style="margin:3px 0 0;font-size:14px;color:#374151;">${paymentLabel}</p>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px;text-align:center;">
            <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
              ${en
                ? `Your order will be delivered within <strong>2–4 business days</strong>.<br>Questions? <a href="mailto:info@oureshop.fun" style="color:#7c3aed;text-decoration:none;">info@oureshop.fun</a>`
                : `Vaša objednávka bude doručená do <strong>2–4 pracovných dní</strong>.<br>Otázky? <a href="mailto:info@oureshop.fun" style="color:#7c3aed;text-decoration:none;">info@oureshop.fun</a>`
              }
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;background:#faf5ff;border-top:1px solid #f3e8ff;text-align:center;">
            <p style="margin:0;font-size:11px;color:#c4b5fd;">© 2026 ${SHOP_NAME} · ${en ? "Automated email" : "Automatický email"}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function adminHtml(
  name: string,
  email: string,
  phone: string,
  orderId: string,
  items: OrderItem[],
  total: number,
  address: string,
  payment: string
) {
  const paymentLabel =
    payment === "card" ? "Platobná karta" : payment === "transfer" ? "Bankový prevod" : "Dobierka";

  const itemsList = items
    .map((i) => `<li style="margin:4px 0;color:#374151;">${h(i.name)} × ${Number(i.quantity)} — ${(i.price * i.quantity).toFixed(2)} €</li>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:24px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">${SHOP_NAME}</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">🛒 Nová objednávka — ${h(orderId)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-spacing:0 8px;">
              <tr><td style="padding:10px 14px;background:#f8f4ff;border-radius:8px;">
                <p style="margin:0;font-size:11px;color:#9333ea;font-weight:600;text-transform:uppercase;">Zákazník</p>
                <p style="margin:4px 0 0;font-size:15px;color:#1f2937;font-weight:500;">${h(name)}</p>
              </td></tr>
              <tr><td style="height:6px;"></td></tr>
              <tr><td style="padding:10px 14px;background:#f8f4ff;border-radius:8px;">
                <p style="margin:0;font-size:11px;color:#9333ea;font-weight:600;text-transform:uppercase;">Kontakt</p>
                <p style="margin:4px 0 0;font-size:14px;color:#1f2937;">${h(email)} · ${h(phone)}</p>
              </td></tr>
              <tr><td style="height:6px;"></td></tr>
              <tr><td style="padding:10px 14px;background:#f8f4ff;border-radius:8px;">
                <p style="margin:0;font-size:11px;color:#9333ea;font-weight:600;text-transform:uppercase;">Adresa</p>
                <p style="margin:4px 0 0;font-size:14px;color:#1f2937;">${h(address)}</p>
              </td></tr>
              <tr><td style="height:6px;"></td></tr>
              <tr><td style="padding:10px 14px;background:#f8f4ff;border-radius:8px;">
                <p style="margin:0;font-size:11px;color:#9333ea;font-weight:600;text-transform:uppercase;">Položky</p>
                <ul style="margin:4px 0 0;padding-left:18px;">${itemsList}</ul>
              </td></tr>
              <tr><td style="height:6px;"></td></tr>
              <tr><td style="padding:10px 14px;background:#f8f4ff;border-radius:8px;">
                <p style="margin:0;font-size:11px;color:#9333ea;font-weight:600;text-transform:uppercase;">Celkom · Platba</p>
                <p style="margin:4px 0 0;font-size:16px;color:#7c3aed;font-weight:700;">${total.toFixed(2)} € · ${paymentLabel}</p>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!(session?.user as any)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, orderId, items, shipping, total, address, phone, payment, lang = "sk" } = body;

  if (!email || !orderId || !items) {
    return NextResponse.json({ error: "Chýbajú údaje." }, { status: 400 });
  }

  // 1. Email zákazníkovi
  const { error: customerError } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: lang === "en" ? `Order Confirmation ${orderId} — ${SHOP_NAME}` : `Potvrdenie objednávky ${orderId} — ${SHOP_NAME}`,
    html: customerHtml(name, orderId, items, shipping, total, address, phone, payment, lang),
  });

  if (customerError) {
    console.error("Customer email error:", customerError);
    return NextResponse.json({ error: customerError.message }, { status: 500 });
  }

  // 2. Email adminovi
  await resend.emails.send({
    from: FROM,
    to: OWNER_EMAIL,
    subject: `🛒 Nová objednávka ${orderId} — ${name}`,
    html: adminHtml(name, email, phone, orderId, items, total, address, payment),
  });

  return NextResponse.json({ ok: true });
}
