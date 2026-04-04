"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Users, Eye, Globe, Monitor, Smartphone, Tablet, Zap, ShoppingCart, UserCheck, UserPlus, Link2, ShieldOff, ShieldCheck, Trash2 } from "lucide-react";

type AnalyticsData = {
  total: number;
  todayCount: number;
  weekCount: number;
  uniqueVisitors: number;
  realtimeCount: number;
  conversionRate: number;
  daily: { date: string; count: number }[];
  byHour: { hour: number; count: number }[];
  topPages: { path: string; count: number }[];
  topCountries: { country: string; count: number }[];
  topReferrers: { source: string; count: number }[];
  devices: { desktop: number; mobile: number; tablet: number };
  newVsReturning: { new: number; returning: number };
  topProducts: { path: string; count: number; name: string }[];
  entryPages: { path: string; count: number }[];
};

const COUNTRY_NAMES: Record<string, string> = {
  SK: "Slovensko", CZ: "Česko", HU: "Maďarsko", AT: "Rakúsko", PL: "Poľsko",
  DE: "Nemecko", GB: "Británia", US: "USA", FR: "Francúzsko", IT: "Taliansko",
  ES: "Španielsko", NL: "Holandsko", RO: "Rumunsko", HR: "Chorvátsko", "??": "Neznáma",
};

function flag(code: string) {
  if (code === "??") return "🌐";
  try {
    return code.toUpperCase().split("").map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397)).join("");
  } catch { return "🌐"; }
}

function pathLabel(path: string) {
  if (path === "/") return "Domovská stránka";
  return path;
}

function StatCard({ label, value, icon, sub, highlight }: {
  label: string; value: number | string; icon: React.ReactNode; sub?: string; highlight?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 ${highlight ? "border-green-200 bg-green-50/40" : "border-purple-50"}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${highlight ? "bg-green-100 text-green-600" : "bg-purple-100 text-purple-600"}`}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-extrabold text-gray-900">{value}</p>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

function BarList({ items, color = "bg-purple-400" }: { items: { label: string; value: number; sub?: string }[]; color?: string }) {
  if (items.length === 0) return <p className="text-sm text-gray-400 text-center py-6">Žiadne dáta.</p>;
  const max = items[0].value;
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400 w-4 shrink-0">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-gray-800 truncate">{item.label}</p>
              <span className="text-xs font-bold text-gray-700 ml-2 shrink-0">{item.value}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${color} rounded-full`} style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
            {item.sub && <p className="text-[10px] text-gray-400 mt-0.5">{item.sub}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");

  // IP filter
  const [myIp, setMyIp] = useState("");
  const [excludedIps, setExcludedIps] = useState<string[]>([]);
  const [ipSaving, setIpSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/my-ip")
      .then((r) => r.json())
      .then((d) => { setMyIp(d.ip ?? ""); setExcludedIps(d.excluded ?? []); });
  }, []);

  const toggleMyIp = async () => {
    setIpSaving(true);
    const isExcluded = excludedIps.includes(myIp);
    const res = await fetch("/api/admin/my-ip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip: myIp, action: isExcluded ? "remove" : "add" }),
    });
    const d = await res.json();
    if (d.excluded) setExcludedIps(d.excluded);
    setIpSaving(false);
  };

  const removeExcluded = async (ip: string) => {
    const res = await fetch("/api/admin/my-ip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, action: "remove" }),
    });
    const d = await res.json();
    if (d.excluded) setExcludedIps(d.excluded);
  };

  const load = useCallback(() => {
    fetch(`/api/admin/analytics?range=${range}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [range]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  // Refresh realtime every 30s
  useEffect(() => {
    const id = setInterval(() => {
      fetch(`/api/admin/analytics?range=${range}`)
        .then((r) => r.json())
        .then((d) => setData(d))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [range]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  if (!data) return <div className="p-8 text-gray-400">Nepodarilo sa načítať dáta.</div>;

  const maxDaily = Math.max(...data.daily.map((d) => d.count), 1);
  const maxHour = Math.max(...data.byHour.map((h) => h.count), 1);
  const totalDevices = data.devices.desktop + data.devices.mobile + data.devices.tablet || 1;
  const totalNvR = data.newVsReturning.new + data.newVsReturning.returning || 1;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}. ${d.getMonth() + 1}.`;
  };

  return (
    <div className="p-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Analytika</h1>
          <p className="text-gray-400 text-sm">Návštevnosť vášho obchodu</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {data.realtimeCount} teraz online
          </div>
          <select value={range} onChange={(e) => setRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400">
            <option value="7">7 dní</option>
            <option value="14">14 dní</option>
            <option value="30">30 dní</option>
            <option value="90">90 dní</option>
          </select>
        </div>
      </div>

      {/* Stat cards — row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Dnes" value={data.todayCount} icon={<Eye size={20} />} />
        <StatCard label="Tento týždeň" value={data.weekCount} icon={<TrendingUp size={20} />} />
        <StatCard label={`Za ${range} dní`} value={data.total} icon={<Globe size={20} />} />
        <StatCard label="Unikátni návštevníci" value={data.uniqueVisitors} icon={<Users size={20} />} sub={`za ${range} dní`} />
      </div>

      {/* Stat cards — row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Noví návštevníci" value={data.newVsReturning.new}
          icon={<UserPlus size={20} />}
          sub={`${Math.round((data.newVsReturning.new / totalNvR) * 100)}% z celkových`} />
        <StatCard label="Vracajúci sa" value={data.newVsReturning.returning}
          icon={<UserCheck size={20} />}
          sub={`${Math.round((data.newVsReturning.returning / totalNvR) * 100)}% z celkových`} />
        <StatCard label="Objednávky" value={data.conversionRate + "%"}
          icon={<ShoppingCart size={20} />}
          sub="konverzný pomer"
          highlight={data.conversionRate > 0} />
        <StatCard label="Realtime (5 min)" value={data.realtimeCount}
          icon={<Zap size={20} />}
          sub="aktuálne návštevy"
          highlight={data.realtimeCount > 0} />
      </div>

      {/* Daily chart */}
      <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
        <h2 className="text-base font-extrabold text-gray-900 mb-6">Návštevnosť po dňoch</h2>
        <div className="flex items-end gap-1 h-36 overflow-x-auto pb-2">
          {data.daily.map((d) => (
            <div key={d.date} className="flex flex-col items-center gap-1 flex-1 min-w-4.5 group relative">
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                {formatDate(d.date)}: {d.count}
              </div>
              <div className="w-full rounded-t-md bg-purple-500 hover:bg-purple-600 transition-colors cursor-default"
                style={{ height: `${Math.max((d.count / maxDaily) * 100, d.count > 0 ? 4 : 1)}%` }} />
              {data.daily.length <= 14 && (
                <span className="text-[10px] text-gray-400">{formatDate(d.date)}</span>
              )}
            </div>
          ))}
        </div>
        {data.daily.length > 14 && (
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>{formatDate(data.daily[0].date)}</span>
            <span>{formatDate(data.daily[data.daily.length - 1].date)}</span>
          </div>
        )}
      </div>

      {/* Hourly chart */}
      <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
        <h2 className="text-base font-extrabold text-gray-900 mb-6">Aktivita podľa hodiny dňa</h2>
        <div className="flex items-end gap-1 h-28">
          {data.byHour.map((h) => (
            <div key={h.hour} className="flex flex-col items-center gap-1 flex-1 group relative">
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                {h.hour}:00 — {h.count}
              </div>
              <div className="w-full rounded-t-md bg-indigo-400 hover:bg-indigo-500 transition-colors cursor-default"
                style={{ height: `${Math.max((h.count / maxHour) * 100, h.count > 0 ? 4 : 1)}%` }} />
              {h.hour % 3 === 0 && (
                <span className="text-[10px] text-gray-400">{h.hour}h</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Countries + Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
          <h2 className="text-base font-extrabold text-gray-900 mb-5">Krajiny</h2>
          <BarList color="bg-emerald-400"
            items={data.topCountries.map((c) => ({
              label: `${flag(c.country)} ${COUNTRY_NAMES[c.country] ?? c.country}`,
              value: c.count,
            }))} />
        </div>

        <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
          <h2 className="text-base font-extrabold text-gray-900 mb-5">Zariadenia</h2>
          <div className="space-y-4">
            {[
              { label: "Desktop", value: data.devices.desktop, icon: <Monitor size={18} />, color: "bg-purple-500", bar: "bg-purple-400" },
              { label: "Mobil", value: data.devices.mobile, icon: <Smartphone size={18} />, color: "bg-indigo-500", bar: "bg-indigo-400" },
              { label: "Tablet", value: data.devices.tablet, icon: <Tablet size={18} />, color: "bg-pink-500", bar: "bg-pink-400" },
            ].map(({ label, value, icon, color, bar }) => {
              const pct = Math.round((value / totalDevices) * 100);
              return (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center text-white shrink-0`}>{icon}</div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                      <span className="text-sm font-bold text-gray-800">{pct}% <span className="text-xs font-normal text-gray-400">({value})</span></span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <h3 className="text-sm font-extrabold text-gray-900 mb-4">Noví vs. vracajúci sa</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">Noví</span>
                  <span className="text-xs font-bold text-gray-800">{Math.round((data.newVsReturning.new / totalNvR) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(data.newVsReturning.new / totalNvR) * 100}%` }} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">Vracajúci</span>
                  <span className="text-xs font-bold text-gray-800">{Math.round((data.newVsReturning.returning / totalNvR) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(data.newVsReturning.returning / totalNvR) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top pages + Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
          <h2 className="text-base font-extrabold text-gray-900 mb-5">Najnavštevovanejšie stránky</h2>
          <BarList items={data.topPages.map((p) => ({ label: pathLabel(p.path), value: p.count }))} />
        </div>
        <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
          <h2 className="text-base font-extrabold text-gray-900 mb-5">Zdroje návštevnosti</h2>
          <BarList color="bg-indigo-400"
            items={data.topReferrers.map((r) => ({ label: r.source, value: r.count }))} />
        </div>
      </div>

      {/* Top products + Entry pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
          <h2 className="text-base font-extrabold text-gray-900 mb-5">Najpopulárnejšie produkty</h2>
          <BarList color="bg-rose-400"
            items={data.topProducts.map((p) => ({ label: p.name, value: p.count, sub: p.path }))} />
        </div>
        <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Link2 size={16} className="text-gray-400" />
            <h2 className="text-base font-extrabold text-gray-900">Vstupné stránky</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">Stránky, na ktoré návštevníci prichádzajú priamo alebo z externého zdroja.</p>
          <BarList color="bg-teal-400"
            items={data.entryPages.map((p) => ({ label: pathLabel(p.path), value: p.count }))} />
        </div>
      </div>

      {/* IP Filter */}
      <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldOff size={16} className="text-gray-400" />
          <h2 className="text-base font-extrabold text-gray-900">Filter IP adries</h2>
        </div>
        <p className="text-xs text-gray-400 mb-5">Vylúč svoju IP adresu zo sledovania — tvoje návštevy sa nebudú počítať v analytike.</p>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
            <span className="text-xs text-gray-400 font-medium">Moja IP:</span>
            <span className="font-mono text-sm font-bold text-gray-800">{myIp || "—"}</span>
            {excludedIps.includes(myIp) && (
              <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">vylúčená</span>
            )}
          </div>
          <button onClick={toggleMyIp} disabled={ipSaving || !myIp}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${
              excludedIps.includes(myIp)
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-red-100 text-red-700 hover:bg-red-200"
            }`}>
            {excludedIps.includes(myIp)
              ? <><ShieldCheck size={15} /> Zahrnúť</>
              : <><ShieldOff size={15} /> Vylúčiť</>}
          </button>
        </div>

        {excludedIps.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Vylúčené IP adresy</p>
            <div className="space-y-2">
              {excludedIps.map((ip) => (
                <div key={ip} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                  <span className="font-mono text-sm text-red-700">{ip}</span>
                  <button onClick={() => removeExcluded(ip)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
