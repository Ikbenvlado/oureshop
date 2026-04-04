import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { code, subtotal } = await req.json();
  if (!code) return NextResponse.json({ error: "No code" }, { status: 400 });

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });
  if (!coupon || !coupon.active) {
    return NextResponse.json({ error: "Neplatný kupón" }, { status: 404 });
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: "Kupón vypršal" }, { status: 410 });
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: "Kupón bol vyčerpaný" }, { status: 410 });
  }
  if (subtotal < coupon.minOrder) {
    return NextResponse.json({ error: `Minimálna objednávka ${coupon.minOrder.toFixed(2)} €` }, { status: 422 });
  }

  let discount = 0;
  if (coupon.type === "percent") discount = Math.round(subtotal * coupon.value) / 100;
  else if (coupon.type === "fixed") discount = Math.min(coupon.value, subtotal);
  else if (coupon.type === "shipping") discount = coupon.value; // caller handles shipping offset

  return NextResponse.json({ coupon: { id: coupon.id, code: coupon.code, type: coupon.type, value: coupon.value }, discount });
}
