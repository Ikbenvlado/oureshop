"use client";

import { useState, useEffect } from "react";
import { CreditCard, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface PaymentIntent {
  id: string; amount: number; currency: string; status: string;
  created: number; receiptEmail: string | null; description: string | null;
}

const statusStyle: Record<string, string> = {
  succeeded: "bg-green-100 text-green-700",
  processing: "bg-blue-100 text-blue-700",
  requires_payment_method: "bg-amber-100 text-amber-700",
  requires_confirmation: "bg-amber-100 text-amber-700",
  canceled: "bg-red-100 text-red-600",
  payment_failed: "bg-red-100 text-red-600",
};

const statusIcon: Record<string, React.ReactNode> = {
  succeeded: <CheckCircle size={13} />,
  processing: <Clock size={13} />,
  canceled: <XCircle size={13} />,
  payment_failed: <XCircle size={13} />,
};

const statusLabel: Record<string, string> = {
  succeeded: "Úspešná",
  processing: "Spracováva sa",
  requires_payment_method: "Čaká na kartu",
  requires_confirmation: "Čaká na potvrdenie",
  canceled: "Zrušená",
  payment_failed: "Zlyhala",
};

export default function AdminPaymentsPage() {
  const [intents, setIntents] = useState<PaymentIntent[]>([]);
  const [balance, setBalance] = useState({ available: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/payments")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); setLoading(false); return; }
        setIntents(d.intents ?? []);
        setBalance(d.balance ?? { available: 0, pending: 0 });
        setLoading(false);
      })
      .catch(() => { setError("Chyba pri načítaní"); setLoading(false); });
  }, []);

  const filtered = filter === "all" ? intents : intents.filter((i) => i.status === filter);
  const succeeded = intents.filter((i) => i.status === "succeeded");
  const totalRevenue = succeeded.reduce((s, i) => s + i.amount, 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="p-8 flex items-center gap-3 text-red-600">
      <AlertCircle size={20} /> {error}
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Stripe platby</h1>
        <p className="text-gray-400 text-sm mt-1">Posledných {intents.length} transakcií</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: TrendingUp, color: "bg-emerald-100 text-emerald-600", label: "Celkové tržby", value: `${totalRevenue.toFixed(2)} €` },
          { icon: CheckCircle, color: "bg-green-100 text-green-600", label: "Dostupný zostatok", value: `${balance.available.toFixed(2)} €` },
          { icon: Clock, color: "bg-amber-100 text-amber-600", label: "Čakajúci zostatok", value: `${balance.pending.toFixed(2)} €` },
        ].map(({ icon: Icon, color, label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-purple-50 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}><Icon size={16} /></div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {[["all", "Všetky"], ["succeeded", "Úspešné"], ["canceled", "Zrušené"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === v ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-purple-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="px-6 py-4 text-left">ID platby</th>
                <th className="px-6 py-4 text-left">E-mail</th>
                <th className="px-6 py-4 text-left">Dátum</th>
                <th className="px-6 py-4 text-right">Suma</th>
                <th className="px-6 py-4 text-center">Stav</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((pi) => (
                <tr key={pi.id} className="hover:bg-purple-50/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <CreditCard size={14} className="text-purple-400 shrink-0" />
                      <span className="font-mono text-xs text-gray-500">{pi.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{pi.receiptEmail ?? "—"}</td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {new Date(pi.created * 1000).toLocaleString("sk-SK")}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    {pi.amount.toFixed(2)} {pi.currency.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle[pi.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {statusIcon[pi.status]} {statusLabel[pi.status] ?? pi.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="py-16 text-center text-gray-400">Žiadne platby</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
