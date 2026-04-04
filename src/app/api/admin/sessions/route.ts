import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getAdminUser() {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;
  if (!userId || !["admin", "super_admin", "editor", "support"].includes(role)) return null;
  return { userId, role };
}

// POST — create session record on login
export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "";

  const user = await prisma.user.findUnique({ where: { id: admin.userId }, select: { email: true } });

  const session = await prisma.adminSession.create({
    data: {
      userId: admin.userId,
      email: user?.email ?? "",
      ip,
      userAgent,
    },
  });

  return NextResponse.json({ sessionId: session.id });
}

// PATCH — record logout time
export async function PATCH(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await req.json();

  if (sessionId) {
    await prisma.adminSession.updateMany({
      where: { id: sessionId, userId: admin.userId, logoutAt: null },
      data: { logoutAt: new Date() },
    });
  } else {
    // fallback — close all open sessions for this user
    await prisma.adminSession.updateMany({
      where: { userId: admin.userId, logoutAt: null },
      data: { logoutAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}

// GET — list sessions (admin/super_admin only)
export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;
  if (!["admin", "super_admin"].includes(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // super_admin sees all sessions; others see only their own
  const where = role === "super_admin" ? {} : { userId };

  const sessions = await prisma.adminSession.findMany({
    where,
    orderBy: { loginAt: "desc" },
    take: 100,
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(sessions);
}
