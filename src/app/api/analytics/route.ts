import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BOT_PATTERNS = /bot|crawler|spider|crawling|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|WhatsApp/i;

export async function POST(req: NextRequest) {
  try {
    const { path, referrer } = await req.json();

    if (!path || path.startsWith("/admin") || path.startsWith("/api")) {
      return NextResponse.json({ ok: true });
    }

    const userAgent = req.headers.get("user-agent") || "";
    if (BOT_PATTERNS.test(userAgent)) {
      return NextResponse.json({ ok: true });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const country = req.headers.get("x-vercel-ip-country") || null;

    // Check excluded IPs
    if (ip) {
      const excludedSetting = await prisma.setting.findUnique({ where: { key: "analytics_excluded_ips" } });
      const excluded = excludedSetting?.value ? excludedSetting.value.split(",").map((s) => s.trim()).filter(Boolean) : [];
      if (excluded.includes(ip)) return NextResponse.json({ ok: true });
    }

    await prisma.pageView.create({
      data: { path, referrer: referrer || null, ip, userAgent: userAgent || null, country },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
