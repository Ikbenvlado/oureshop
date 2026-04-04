import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { items } = await req.json();

    await prisma.$transaction(async (tx) => {
      for (const item of items as { id: number; quantity: number }[]) {
        await tx.product.update({
          where: { id: item.id },
          data: { stock: { decrement: item.quantity } },
        });

        const updated = await tx.product.findUnique({ where: { id: item.id } });
        if (updated && updated.stock !== null && updated.stock <= 0) {
          await tx.product.update({
            where: { id: item.id },
            data: { inStock: false },
          });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Chyba pri aktualizácii skladu." }, { status: 500 });
  }
}
