import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Stripe from "stripe";

export async function GET() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!role || !["admin", "super_admin"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });

  const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" });

  const [intentsRes, balanceRes] = await Promise.all([
    stripe.paymentIntents.list({ limit: 50 }),
    stripe.balance.retrieve(),
  ]);

  const intents = intentsRes.data.map((pi) => ({
    id: pi.id,
    amount: pi.amount / 100,
    currency: pi.currency,
    status: pi.status,
    created: pi.created,
    receiptEmail: pi.receipt_email,
    description: pi.description,
  }));

  const available = balanceRes.available.reduce((sum, b) => sum + b.amount, 0) / 100;
  const pending = balanceRes.pending.reduce((sum, b) => sum + b.amount, 0) / 100;

  return NextResponse.json({ intents, balance: { available, pending } });
}
