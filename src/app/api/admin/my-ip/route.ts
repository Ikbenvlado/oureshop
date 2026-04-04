import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  return ["admin", "super_admin", "editor", "support"].includes(role);
}

export async function GET(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const setting = await prisma.setting.findUnique({ where: { key: "analytics_excluded_ips" } });
  const excluded = setting?.value ? setting.value.split(",").map((s) => s.trim()).filter(Boolean) : [];

  return NextResponse.json({ ip, excluded });
}

export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ip, action } = await req.json(); // action: "add" | "remove"

  const setting = await prisma.setting.findUnique({ where: { key: "analytics_excluded_ips" } });
  let excluded = setting?.value ? setting.value.split(",").map((s) => s.trim()).filter(Boolean) : [];

  if (action === "add" && !excluded.includes(ip)) {
    excluded.push(ip);
  } else if (action === "remove") {
    excluded = excluded.filter((e) => e !== ip);
  }

  await prisma.setting.upsert({
    where: { key: "analytics_excluded_ips" },
    update: { value: excluded.join(",") },
    create: { key: "analytics_excluded_ips", value: excluded.join(",") },
  });

  return NextResponse.json({ ok: true, excluded });
}
