"use client";

import { useState, useEffect } from "react";
import { Package, ShoppingBag, Users, TrendingUp, ArrowRight, BarChart2, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";

const statusStyle: Record<string, string> = {
  nová: "bg-blue-100 text-blue-700",
  potvrdená: "bg-cyan-100 text-cyan-700",
  zaplatená: "bg-teal-100 text-teal-700",
  spracovaná: "bg-amber-100 text-amber-700",
  expedovaná: "bg-orange-100 text-orange-700",
  doručená: "bg-green-100 text-green-700",
  zrušená: "bg-red-100 text-red-600",
};

type Period = "7" | "30";

export default function AdminDashboardPage() {
  const { adminName } = useAdminAuth();
  const [stats, setStats] = useState({
    products: 0, inStock: 0, orders: 0, newOrders: 0,
    customers: 0, admins: 0, revenue: 0, avgOrderValue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();

      const prods = data.products ?? [];
      const ords = data.orders ?? [];

      const revenue = ords
        .filter((o: any) => o.status !== "zrušená")
        .reduce((sum: number, o: any) => sum + Number(o.total), 0);

      setStats({
        products: prods.length,
        inStock: prods.filter((p: any) => p.inStock ?? p.in_stock).length,
        orders: ords.length,
        newOrders: ords.filter((o: any) => o.status === "nová").length,
        customers: data.customerCount ?? 0,
        admins: data.adminCount ?? 0,
        revenue,
        avgOrderValue: data.avgOrderValue ?? 0,
      });
      setRecentOrders(ords.slice(0, 5));
      setDailyStats(data.dailyStats ?? []);
      setTopProducts(data.topProducts ?? []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const chartData = period === "7" ? dailyStats.slice(-7) : dailyStats;

  const statCards = [
    { label: "Produkty", value: stats.products, sub: `${stats.inStock} skladom`, icon: Package, color: "bg-purple-100 text-purple-600", href: "/admin/products" },
    { label: "Objednávky", value: stats.orders, sub: `${stats.newOrders} nových`, icon: ShoppingBag, color: "bg-pink-100 text-pink-600", href: "/admin/orders" },
    { label: "Zákazníci", value: stats.customers, sub: `${stats.admins} adminov`, icon: Users, color: "bg-violet-100 text-violet-600", href: "/admin/customers" },
    { label: "Celkové tržby", value: `${stats.revenue.toFixed(0)} €`, sub: `Priemerná objednávka: ${stats.avgOrderValue.toFixed(2)} €`, icon: TrendingUp, color: "bg-emerald-100 text-emerald-600", href: "/admin/orders" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Vitaj späť, {adminName || "admin"}!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map(({ label, value, sub, icon: Icon, color, href }) => (
          <Link key={label} href={href}
            className="bg-white rounded-2xl p-5 border border-purple-50 shadow-sm hover:shadow-md hover:border-purple-100 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={20} />
              </div>
              <ArrowRight size={16} className="text-gray-300 group-hover:text-purple-400 transition-colors mt-1" />
            </div>
            <div className="text-2xl font-extrabold text-gray-900">{value}</div>
            <div className="text-sm font-semibold text-gray-700 mt-0.5">{label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
          </Link>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart2 size={18} className="text-purple-500" />
            <h2 className="text-base font-extrabold text-gray-900">Tržby</h2>
          </div>
          <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
            {(["7", "30"] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${period === p ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {p === "7" ? "7 dní" : "30 dní"}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(v: any) => [`${Number(v).toFixed(2)} €`, "Tržby"]}
              contentStyle={{ borderRadius: "12px", border: "1px solid #f3e8ff", fontSize: 13 }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5}
              fill="url(#colorRevenue)" dot={false} activeDot={{ r: 5, fill: "#7c3aed" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <ShoppingCart size={17} className="text-pink-500" />
            <h2 className="text-base font-extrabold text-gray-900">Top produkty</h2>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Žiadne dáta</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.qty} ks predaných</p>
                  </div>
                  <span className="text-sm font-extrabold text-gray-900 whitespace-nowrap">{p.revenue.toFixed(2)} €</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders per day chart */}
        <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <ShoppingBag size={17} className="text-emerald-500" />
            <h2 className="text-base font-extrabold text-gray-900">Počet objednávok</h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                formatter={(v: any) => [v, "Objednávky"]}
                contentStyle={{ borderRadius: "12px", border: "1px solid #f3e8ff", fontSize: 13 }}
              />
              <Bar dataKey="orders" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-extrabold text-gray-900">Posledné objednávky</h2>
          <Link href="/admin/orders" className="text-sm text-purple-600 hover:underline font-medium">
            Zobraziť všetky →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="pb-3 text-left">ID</th>
                <th className="pb-3 text-left">Zákazník</th>
                <th className="pb-3 text-left">Dátum</th>
                <th className="pb-3 text-right">Suma</th>
                <th className="pb-3 text-right">Stav</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-purple-50/50 transition-colors">
                  <td className="py-3 font-mono text-gray-500 font-medium text-xs">{order.id}</td>
                  <td className="py-3 font-semibold text-gray-800">{order.customerName ?? order.customer_name}</td>
                  <td className="py-3 text-gray-400">{order.date}</td>
                  <td className="py-3 text-right font-bold text-gray-900">{Number(order.total).toFixed(2)} €</td>
                  <td className="py-3 text-right">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle[order.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
