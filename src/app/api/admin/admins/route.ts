import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!role || (role !== "admin" && role !== "super_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admins = await prisma.user.findMany({
    where: { role: { in: ["admin", "super_admin"] } },
    select: { id: true, name: true, role: true },
  });

  return NextResponse.json(admins);
}
