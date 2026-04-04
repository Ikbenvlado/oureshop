"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Mail, TrendingUp, ShoppingBag, Ban, CheckCircle, X, ChevronDown } from "lucide-react";

interface CustomerRow {
  id: string; name: string; email: string; phone: string;
  orders: number; totalSpent: number; joined: string; blocked: boolean;
  customerSeq: number | null;
}

interface OrderRow { id: string; date: string; total: number; status: string; }

type SortKey = "name" | "orders" | "totalSpent" | "joined";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [ordersByUser, setOrdersByUser] = useState<Map<string, OrderRow[]>>(new Map());
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalSpent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterBlocked, setFilterBlocked] = useState<"all" | "active" | "blocked">("all");
  const [detail, setDetail] = useState<CustomerRow | null>(null);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/admin/customers");
      if (!res.ok) { setDataLoading(false); return; }
      const data = await res.json();
      const profiles = data.customers ?? [];
      const orders = data.orders ?? [];

      const byUser = new Map<string, { email: string; count: number; total: number }>();
      const ordersMap = new Map<string, OrderRow[]>();

      for (const o of orders) {
        const userId = o.userId ?? o.user_id;
        if (!userId) continue;
        const email = o.customerEmail ?? o.customer_email ?? "";
        const existing = byUser.get(userId) ?? { email, count: 0, total: 0 };
        existing.count += 1;
        existing.total += Number(o.total);
        byUser.set(userId, existing);

        const userOrders = ordersMap.get(userId) ?? [];
        userOrders.push({ id: o.id, date: o.date ?? "—", total: Number(o.total), status: o.status });
        ordersMap.set(userId, userOrders);
      }

      const rows: CustomerRow[] = profiles.map((p: any) => ({
        id: p.id,
        name: p.name,
        email: byUser.get(p.id)?.email ?? p.email ?? "—",
        phone: p.phone ?? "—",
        orders: byUser.get(p.id)?.count ?? 0,
        totalSpent: byUser.get(p.id)?.total ?? 0,
        joined: (() => { const d = new Date((p.createdAt ?? p.created_at) ?? ""); return isNaN(d.getTime()) ? "—" : `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`; })(),
        blocked: p.blocked ?? false,
        customerSeq: p.customerSeq ?? null,
      }));

      setCustomers(rows);
      setOrdersByUser(ordersMap);
      setDataLoading(false);
    }
    fetchData();
  }, []);

  const toggleBlocked = async (id: string, blocked: boolean) => {
    await fetch("/api/admin/customers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, blocked }) });
    setCustomers((prev) => prev.map((c) => c.id === id ? { ...c, blocked } : c));
    if (detail?.id === id) setDetail((d) => d ? { ...d, blocked } : d);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let list = customers.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      const matchBlocked = filterBlocked === "all" || (filterBlocked === "blocked" ? c.blocked : !c.blocked);
      return matchSearch && matchBlocked;
    });
    list = list.sort((a, b) => {
      const av = a[sortKey] as any, bv = b[sortKey] as any;
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [customers, search, sortKey, sortDir, filterBlocked]);

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgSpent = customers.length > 0 ? totalRevenue / customers.length : 0;
  const topCustomer = [...customers].sort((a, b) => b.totalSpent - a.totalSpent)[0];

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => handleSort(k)} className="flex items-center gap-1 hover:text-purple-600 transition-colors">
      {label}
      {sortKey === k && <ChevronDown size={12} className={sortDir === "asc" ? "rotate-180" : ""} />}
    </button>
  );

  if (dataLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Zákazníci</h1>
          <p className="text-gray-400 text-sm mt-1">{customers.length} registrovaných zákazníkov</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Hľadať zákazníka..."
              className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white w-56" />
          </div>
          <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
            {([["all", "Všetci"], ["active", "Aktívni"], ["blocked", "Blokovaní"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setFilterBlocked(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterBlocked === v ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: TrendingUp, color: "bg-purple-100 text-purple-600", label: "Celkové tržby", value: `${totalRevenue.toFixed(2)} €` },
          { icon: ShoppingBag, color: "bg-pink-100 text-pink-600", label: "Priemerná útrata", value: `${avgSpent.toFixed(2)} €` },
          { icon: TrendingUp, color: "bg-violet-100 text-violet-600", label: "Top zákazník", value: topCustomer?.name ?? "—" },
        ].map(({ icon: Icon, color, label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-purple-50 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}><Icon size={16} /></div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-2xl font-extrabold gradient-text truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-purple-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="px-6 py-4 text-left"><SortBtn k="name" label="Zákazník" /></th>
                <th className="px-6 py-4 text-left">E-mail</th>
                <th className="px-6 py-4 text-center"><SortBtn k="orders" label="Objednávky" /></th>
                <th className="px-6 py-4 text-right"><SortBtn k="totalSpent" label="Útrata" /></th>
                <th className="px-6 py-4 text-right"><SortBtn k="joined" label="Registrácia" /></th>
                <th className="px-6 py-4 text-right">Akcie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr key={c.id} className={`hover:bg-purple-50/40 transition-colors ${c.blocked ? "opacity-50" : ""}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${c.blocked ? "bg-gray-300" : "gradient-btn"}`}>
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{c.name}</p>
                        {c.customerSeq && (
                          <span className="text-xs font-bold text-purple-500">OS-{c.customerSeq}</span>
                        )}
                        {c.blocked && <span className="text-xs text-red-500 font-medium block">Blokovaný</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500"><Mail size={11} className="text-gray-400" />{c.email}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">{c.orders}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-extrabold gradient-text">{c.totalSpent.toFixed(2)} €</td>
                  <td className="px-6 py-4 text-right text-gray-400 text-xs">{c.joined}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setDetail(c)} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Detail">
                        <TrendingUp size={14} />
                      </button>
                      <button onClick={() => toggleBlocked(c.id, !c.blocked)}
                        className={`p-2 rounded-lg transition-colors ${c.blocked ? "text-green-500 hover:bg-green-50" : "text-gray-400 hover:text-red-500 hover:bg-red-50"}`}
                        title={c.blocked ? "Odblokovať" : "Blokovať"}>
                        {c.blocked ? <CheckCircle size={14} /> : <Ban size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-16 text-gray-400">Žiadni zákazníci nenájdení</div>}
        </div>
      </div>

      {/* Customer Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full gradient-btn flex items-center justify-center text-white font-bold text-lg">
                  {detail.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">{detail.name}</h2>
                  <p className="text-xs text-gray-400">{detail.email}</p>
                </div>
              </div>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Objednávky", detail.orders],
                  ["Celková útrata", `${detail.totalSpent.toFixed(2)} €`],
                  ["Telefón", detail.phone || "—"],
                  ["Registrácia", detail.joined],
                ].map(([label, value]) => (
                  <div key={label as string} className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                    <p className="font-bold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">História objednávok</p>
                {(ordersByUser.get(detail.id) ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Žiadne objednávky</p>
                ) : (
                  <div className="space-y-2">
                    {(ordersByUser.get(detail.id) ?? []).map((o) => (
                      <div key={o.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 text-sm">
                        <div>
                          <p className="font-mono text-xs text-gray-500 font-medium">{o.id}</p>
                          <p className="text-xs text-gray-400">{o.date}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">{o.status}</span>
                          <span className="font-bold text-gray-900">{o.total.toFixed(2)} €</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={() => toggleBlocked(detail.id, !detail.blocked)}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                  detail.blocked ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                }`}>
                {detail.blocked ? <><CheckCircle size={15} /> Odblokovať zákazníka</> : <><Ban size={15} /> Blokovať zákazníka</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
