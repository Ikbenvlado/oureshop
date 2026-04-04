"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag, X } from "lucide-react";

interface Coupon {
  id: string; code: string; type: string; value: number;
  minOrder: number; maxUses: number | null; usedCount: number;
  active: boolean; expiresAt: string | null; createdAt: string;
}

const typeLabel: Record<string, string> = { percent: "% zľava", fixed: "Fixná zľava", shipping: "Doprava zdarma" };
const typeColor: Record<string, string> = {
  percent: "bg-purple-100 text-purple-700",
  fixed: "bg-emerald-100 text-emerald-700",
  shipping: "bg-blue-100 text-blue-700",
};

const empty = { code: "", type: "percent", value: 10, minOrder: 0, maxUses: "", expiresAt: "" };

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<typeof empty>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchCoupons(); }, []);

  async function fetchCoupons() {
    setLoading(true);
    const res = await fetch("/api/admin/coupons");
    const data = await res.json();
    setCoupons(data.coupons ?? []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        type: form.type,
        value: Number(form.value),
        minOrder: Number(form.minOrder),
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Chyba"); setSaving(false); return; }
    setCoupons((prev) => [data.coupon, ...prev]);
    setShowForm(false);
    setForm(empty);
    setSaving(false);
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch("/api/admin/coupons", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, active }) });
    setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, active } : c));
  }

  async function deleteCoupon(id: string) {
    if (!confirm("Zmazať kupón?")) return;
    await fetch("/api/admin/coupons", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Kupóny</h1>
          <p className="text-gray-400 text-sm mt-1">{coupons.length} kupónov v databáze</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 gradient-btn text-white px-4 py-2.5 rounded-xl text-sm font-semibold">
          <Plus size={16} /> Nový kupón
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-purple-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="px-6 py-4 text-left">Kód</th>
                <th className="px-6 py-4 text-left">Typ</th>
                <th className="px-6 py-4 text-right">Hodnota</th>
                <th className="px-6 py-4 text-right">Min. obj.</th>
                <th className="px-6 py-4 text-center">Použitia</th>
                <th className="px-6 py-4 text-left">Platnosť</th>
                <th className="px-6 py-4 text-center">Stav</th>
                <th className="px-6 py-4 text-right">Akcie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.map((c) => (
                <tr key={c.id} className={`hover:bg-purple-50/40 transition-colors ${!c.active ? "opacity-50" : ""}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-purple-400" />
                      <span className="font-mono font-bold text-gray-800">{c.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${typeColor[c.type] ?? "bg-gray-100 text-gray-600"}`}>
                      {typeLabel[c.type] ?? c.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    {c.type === "percent" ? `${c.value}%` : `${c.value.toFixed(2)} €`}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500">{c.minOrder > 0 ? `${c.minOrder.toFixed(2)} €` : "—"}</td>
                  <td className="px-6 py-4 text-center text-gray-500">
                    {c.usedCount}{c.maxUses !== null ? `/${c.maxUses}` : ""}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("sk-SK") : "∞"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => toggleActive(c.id, !c.active)}
                      className={`transition-colors ${c.active ? "text-emerald-500 hover:text-emerald-600" : "text-gray-300 hover:text-gray-400"}`}>
                      {c.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => deleteCoupon(c.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr><td colSpan={8} className="py-16 text-center text-gray-400">Žiadne kupóny</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-extrabold text-gray-900">Nový kupón</h2>
              <button onClick={() => { setShowForm(false); setForm(empty); setError(""); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Kód kupóna</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="LETNÁ20" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono uppercase text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Typ</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400">
                    <option value="percent">% zľava</option>
                    <option value="fixed">Fixná zľava (€)</option>
                    <option value="shipping">Doprava zdarma</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    {form.type === "percent" ? "Hodnota (%)" : form.type === "shipping" ? "Max. doprava (€)" : "Zľava (€)"}
                  </label>
                  <input type="number" min="0" step="0.01" value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Min. objednávka (€)</label>
                  <input type="number" min="0" step="0.01" value={form.minOrder}
                    onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Max. použití (prázdne = ∞)</label>
                  <input type="number" min="1" value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                    placeholder="∞"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Platnosť do (prázdne = ∞)</label>
                <input type="date" value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setForm(empty); setError(""); }}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Zrušiť
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 gradient-btn text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                  {saving ? "Ukladám..." : "Vytvoriť kupón"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
