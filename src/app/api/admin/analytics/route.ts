import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  return ["admin", "super_admin"].includes(role);
}

export async function GET(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const range = req.nextUrl.searchParams.get("range") ?? "30";
  const days = Math.min(Math.max(parseInt(range) || 30, 1), 90);

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

  const [allViews, todayCount, weekCount, realtimeCount, ordersInPeriod] = await Promise.all([
    prisma.pageView.findMany({
      where: { createdAt: { gte: since } },
      select: { path: true, referrer: true, ip: true, userAgent: true, country: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pageView.count({ where: { createdAt: { gte: today } } }),
    prisma.pageView.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.pageView.count({ where: { createdAt: { gte: fiveMinAgo } } }),
    prisma.order.count({ where: { createdAt: { gte: since } } }),
  ]);

  // Daily chart
  const dailyMap: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap[d.toISOString().split("T")[0]] = 0;
  }
  for (const v of allViews) {
    const key = new Date(v.createdAt).toISOString().split("T")[0];
    if (key in dailyMap) dailyMap[key]++;
  }
  const daily = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

  // Hourly breakdown (0-23)
  const hourMap: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourMap[h] = 0;
  for (const v of allViews) {
    const h = new Date(v.createdAt).getHours();
    hourMap[h]++;
  }
  const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourMap[h] }));

  // Top pages
  const pageMap: Record<string, number> = {};
  for (const v of allViews) {
    pageMap[v.path] = (pageMap[v.path] ?? 0) + 1;
  }
  const topPages = Object.entries(pageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  // Top countries
  const countryMap: Record<string, number> = {};
  for (const v of allViews) {
    const c = v.country || "??";
    countryMap[c] = (countryMap[c] ?? 0) + 1;
  }
  const topCountries = Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([country, count]) => ({ country, count }));

  // Top referrers
  const refMap: Record<string, number> = {};
  for (const v of allViews) {
    const ref = v.referrer
      ? (() => { try { return new URL(v.referrer).hostname.replace("www.", ""); } catch { return v.referrer; } })()
      : "Priamy odkaz";
    refMap[ref] = (refMap[ref] ?? 0) + 1;
  }
  const topReferrers = Object.entries(refMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([source, count]) => ({ source, count }));

  // Devices
  let desktop = 0, mobile = 0, tablet = 0;
  for (const v of allViews) {
    const ua = v.userAgent ?? "";
    if (/tablet|ipad/i.test(ua)) tablet++;
    else if (/mobile|android|iphone/i.test(ua)) mobile++;
    else desktop++;
  }

  // Unique visitors (by IP)
  const uniqueIps = new Set(allViews.map((v) => v.ip).filter(Boolean));

  // New vs returning (IPs in current period vs seen before)
  const ipsInPeriod = [...uniqueIps] as string[];
  let returningCount = 0;
  if (ipsInPeriod.length > 0) {
    returningCount = await prisma.pageView.groupBy({
      by: ["ip"],
      where: { ip: { in: ipsInPeriod }, createdAt: { lt: since } },
    }).then((r) => r.length);
  }
  const newCount = uniqueIps.size - returningCount;

  // Conversion rate
  const conversionRate = uniqueIps.size > 0
    ? Math.round((ordersInPeriod / uniqueIps.size) * 1000) / 10
    : 0;

  // Top product pages
  const productViews = allViews.filter((v) => /^\/products\/\d+$/.test(v.path));
  const productPageMap: Record<string, number> = {};
  for (const v of productViews) {
    productPageMap[v.path] = (productPageMap[v.path] ?? 0) + 1;
  }
  const productEntries = Object.entries(productPageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const productIds = productEntries.map(([path]) => parseInt(path.split("/")[2])).filter(Boolean);
  const products = productIds.length > 0
    ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })
    : [];
  const productNameMap = Object.fromEntries(products.map((p) => [p.id, p.name]));

  const topProducts = productEntries.map(([path, count]) => {
    const id = parseInt(path.split("/")[2]);
    return { path, count, name: productNameMap[id] ?? path };
  });

  // Entry pages (external referrer or no referrer but not internal)
  const entryMap: Record<string, number> = {};
  for (const v of allViews) {
    const isExternal = !v.referrer || !v.referrer.includes("ourstone.fun");
    if (isExternal) {
      entryMap[v.path] = (entryMap[v.path] ?? 0) + 1;
    }
  }
  const entryPages = Object.entries(entryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, count]) => ({ path, count }));

  return NextResponse.json({
    total: allViews.length,
    todayCount,
    weekCount,
    uniqueVisitors: uniqueIps.size,
    realtimeCount,
    conversionRate,
    daily,
    byHour,
    topPages,
    topCountries,
    topReferrers,
    devices: { desktop, mobile, tablet },
    newVsReturning: { new: newCount, returning: returningCount },
    topProducts,
    entryPages,
  });
}
