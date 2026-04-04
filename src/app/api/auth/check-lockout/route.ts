import { NextRequest, NextResponse } from "next/server";
import { isLockedOut } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  if (!email) return NextResponse.json({ locked: false, remainingMinutes: 0 });
  const result = await isLockedOut(email);
  return NextResponse.json(result);
}
