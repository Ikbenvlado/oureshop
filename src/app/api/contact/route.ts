import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const SHOP_NAME = "OurStone";
const FROM = `${SHOP_NAME} <noreply@ourstone.fun>`;
const OWNER_EMAIL = "vladimirstricko@rocketmail.com";

function notificationHtml(meno: string, email: string, sprava: string) {
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
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Nová správa z kontaktného formulára</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:10px 14px;background:#f8f4ff;border-radius:8px;margin-bottom:8px;">
                  <p style="margin:0;font-size:11px;color:#9333ea;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Meno</p>
                  <p style="margin:4px 0 0;font-size:15px;color:#1f2937;font-weight:500;">${meno}</p>
                </td>
              </tr>
              <tr><td style="height:8px;"></td></tr>
              <tr>
                <td style="padding:10px 14px;background:#f8f4ff;border-radius:8px;">
                  <p style="margin:0;font-size:11px;color:#9333ea;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email</p>
                  <p style="margin:4px 0 0;font-size:15px;color:#1f2937;font-weight:500;">${email}</p>
                </td>
              </tr>
              <tr><td style="height:8px;"></td></tr>
              <tr>
                <td style="padding:10px 14px;background:#f8f4ff;border-radius:8px;">
                  <p style="margin:0;font-size:11px;color:#9333ea;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Správa</p>
                  <p style="margin:4px 0 0;font-size:15px;color:#1f2937;line-height:1.6;white-space:pre-wrap;">${sprava}</p>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
              Odpovedz priamo na tento email alebo kontaktuj zákazníka na <a href="mailto:${email}" style="color:#7c3aed;">${email}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function autoReplyHtml(meno: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${SHOP_NAME}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;text-align:center;">
            <div style="width:60px;height:60px;background:#f0fdf4;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:28px;">✅</span>
            </div>
            <h2 style="margin:0 0 12px;font-size:20px;color:#1f2937;">Správa prijatá!</h2>
            <p style="margin:0 0 8px;font-size:15px;color:#6b7280;">Dobrý deň, <strong style="color:#1f2937;">${meno}</strong></p>
            <p style="margin:0;font-size:15px;color:#6b7280;line-height:1.6;">
              Ďakujeme za vašu správu.<br>Ozveme sa vám čo najskôr.
            </p>
            <div style="margin:32px 0;height:1px;background:#f3f4f6;"></div>
            <p style="margin:0;font-size:13px;color:#9ca3af;">S pozdravom,<br><strong style="color:#7c3aed;">${SHOP_NAME}</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;background:#fafafa;border-top:1px solid #f3f4f6;text-align:center;">
            <p style="margin:0;font-size:11px;color:#d1d5db;">Toto je automatická správa, prosím neodpovedajte na ňu.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { meno, email, sprava } = body;

  if (!meno || !email || !sprava) {
    return NextResponse.json({ error: "Vyplň všetky polia." }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: OWNER_EMAIL,
    subject: `Nová správa od ${meno}`,
    html: notificationHtml(meno, email, sprava),
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: `Chyba: ${error.message}` }, { status: 500 });
  }

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Vaša správa bola prijatá — ${SHOP_NAME}`,
    html: autoReplyHtml(meno),
  });

  return NextResponse.json({ ok: true });
}
