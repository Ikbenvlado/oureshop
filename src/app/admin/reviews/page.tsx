"use client";

import { useState, useEffect, useMemo } from "react";
import { Star, Check, X, Clock } from "lucide-react";

interface ReviewRow {
  id: number;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  user: { name: string; email: string };
  product: { name: string };
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={13} className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/reviews")
      .then((r) => r.json())
      .then((data) => { setReviews(data ?? []); setLoading(false); });
  }, []);

  const filtered = useMemo(() =>
    filter === "all" ? reviews : reviews.filter((r) => r.status === filter),
    [reviews, filter]
  );

  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  const handleAction = async (id: number, status: "approved" | "rejected") => {
    setSaving(id);
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    }
    setSaving(null);
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700"><Check size={11} /> Schválená</span>;
    if (status === "rejected") return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600"><X size={11} /> Zamietnutá</span>;
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700"><Clock size={11} /> Čaká</span>;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Recenzie</h1>
          <p className="text-gray-400 text-sm mt-1">{reviews.length} recenzií celkom{pendingCount > 0 && `, ${pendingCount} čaká na schválenie`}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl w-fit mb-5">
        {([["all", "Všetky"], ["pending", "Čakajúce"], ["approved", "Schválené"], ["rejected", "Zamietnuté"]] as const).map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === val ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {label}
            {val === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-purple-50 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">Žiadne recenzie.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="px-5 py-4 text-left">Zákazník</th>
                <th className="px-5 py-4 text-left">Produkt</th>
                <th className="px-5 py-4 text-left">Hodnotenie</th>
                <th className="px-5 py-4 text-left">Recenzia</th>
                <th className="px-5 py-4 text-center">Stav</th>
                <th className="px-5 py-4 text-right">Akcie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-purple-50/40 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-800 text-sm">{r.user.name || "—"}</p>
                    <p className="text-xs text-gray-400">{r.user.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-700 font-medium line-clamp-1 max-w-[160px] block">{r.product.name}</span>
                  </td>
                  <td className="px-5 py-4">
                    <Stars rating={r.rating} />
                    <span className="text-xs text-gray-400 mt-0.5 block">{r.rating}/5</span>
                  </td>
                  <td className="px-5 py-4 max-w-xs">
                    <p className="text-sm text-gray-600 line-clamp-2">{r.comment}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString("sk-SK")}</p>
                  </td>
                  <td className="px-5 py-4 text-center">{statusBadge(r.status)}</td>
                  <td className="px-5 py-4 text-right">
                    {r.status === "pending" ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAction(r.id, "approved")}
                          disabled={saving === r.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          <Check size={12} /> Schváliť
                        </button>
                        <button
                          onClick={() => handleAction(r.id, "rejected")}
                          disabled={saving === r.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          <X size={12} /> Zamietnuť
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        {r.status === "approved" && (
                          <button
                            onClick={() => handleAction(r.id, "rejected")}
                            disabled={saving === r.id}
                            className="px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            Zamietnuť
                          </button>
                        )}
                        {r.status === "rejected" && (
                          <button
                            onClick={() => handleAction(r.id, "approved")}
                            disabled={saving === r.id}
                            className="px-3 py-1.5 border border-green-200 text-green-600 rounded-lg text-xs font-semibold hover:bg-green-50 transition-colors disabled:opacity-50"
                          >
                            Schváliť
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
