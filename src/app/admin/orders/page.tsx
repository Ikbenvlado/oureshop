"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Eye, X, Search, Plus, FileText, StickyNote, Trash2 } from "lucide-react";

type OrderStatus = "nová" | "potvrdená" | "zaplatená" | "spracovaná" | "expedovaná" | "doručená" | "zrušená";

const statusOptions: OrderStatus[] = ["nová", "potvrdená", "zaplatená", "spracovaná", "expedovaná", "doručená", "zrušená"];

const statusStyle: Record<OrderStatus, string> = {
  nová: "bg-blue-100 text-blue-700",
  potvrdená: "bg-cyan-100 text-cyan-700",
  zaplatená: "bg-teal-100 text-teal-700",
  spracovaná: "bg-amber-100 text-amber-700",
  expedovaná: "bg-orange-100 text-orange-700",
  doručená: "bg-green-100 text-green-700",
  zrušená: "bg-red-100 text-red-600",
};

interface OrderItem { name: string; price: number; quantity: number; }
interface Order {
  id: string; customer: string; email: string; address: string;
  total: number; status: OrderStatus; date: string; items: OrderItem[]; notes?: string;
}

function mapOrder(row: any): Order {
  return {
    id: row.id,
    customer: row.customerName ?? row.customer_name,
    email: row.customerEmail ?? row.customer_email,
    address: row.address,
    total: Number(row.total),
    status: row.status as OrderStatus,
    date: row.date,
    notes: row.notes ?? "",
    items: (row.items ?? row.order_items ?? []).map((i: any) => ({
      name: i.name, price: Number(i.price), quantity: i.quantity,
    })),
  };
}

function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

function printInvoice(order: Order) {
  const html = `
    <!DOCTYPE html><html><head>
    <meta charset="utf-8">
    <title>Faktúra ${esc(order.id)}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
      h1 { font-size: 24px; margin-bottom: 4px; }
      .meta { color: #666; font-size: 13px; margin-bottom: 32px; }
      .section { margin-bottom: 24px; }
      .label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #888; margin-bottom: 6px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th { text-align: left; padding: 8px 12px; background: #f5f5f5; font-size: 12px; }
      td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
      .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 16px; }
      .status { display: inline-block; padding: 4px 10px; border-radius: 20px; background: #e9d5ff; color: #6d28d9; font-size: 12px; }
    </style>
    </head><body>
    <h1>Faktúra / Doklad</h1>
    <div class="meta">OurEshop · oureshop.fun · vladimirstricko@rocketmail.com</div>
    <div class="section">
      <div class="label">Číslo objednávky</div>
      <strong>${esc(order.id)}</strong> &nbsp; <span class="status">${esc(order.status)}</span>
      <div style="color:#666;font-size:13px;margin-top:4px;">Dátum: ${esc(order.date)}</div>
    </div>
    <div class="section">
      <div class="label">Zákazník</div>
      <div>${esc(order.customer)}</div>
      <div style="color:#666;font-size:13px;">${esc(order.email)}</div>
      <div style="color:#666;font-size:13px;">${esc(order.address)}</div>
    </div>
    <div class="section">
      <div class="label">Položky</div>
      <table>
        <thead><tr><th>Produkt</th><th>Počet</th><th style="text-align:right">Cena/ks</th><th style="text-align:right">Spolu</th></tr></thead>
        <tbody>
          ${order.items.map(i => `
            <tr>
              <td>${esc(i.name)}</td>
              <td>${i.quantity}</td>
              <td style="text-align:right">${i.price.toFixed(2)} €</td>
              <td style="text-align:right">${(i.price * i.quantity).toFixed(2)} €</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <div class="total">Celkom: ${order.total.toFixed(2)} €</div>
    </div>
    ${order.notes ? `<div class="section"><div class="label">Poznámka</div><div>${esc(order.notes)}</div></div>` : ""}
    </body></html>
  `;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.print();
}

const emptyManualForm = {
  customerName: "", customerEmail: "", address: "", notes: "",
  items: [{ name: "", price: "", quantity: "1" }],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [detail, setDetail] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "všetky">("všetky");
  const [search, setSearch] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState(emptyManualForm);
  const [savingManual, setSavingManual] = useState(false);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => { setOrders((data ?? []).map(mapOrder)); setDataLoading(false); })
      .catch(() => setDataLoading(false));
  }, []);

  const updateStatus = async (id: string, status: OrderStatus) => {
    const res = await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (!res.ok) return;
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    if (detail?.id === id) setDetail((d) => d ? { ...d, status } : d);
  };

  const openDetail = (order: Order) => {
    setDetail(order);
    setNoteInput(order.notes ?? "");
  };

  const saveNote = async () => {
    if (!detail) return;
    setSavingNote(true);
    const res = await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: detail.id, notes: noteInput }) });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => o.id === detail.id ? { ...o, notes: noteInput } : o));
      setDetail((d) => d ? { ...d, notes: noteInput } : d);
    }
    setSavingNote(false);
  };

  const handleManualSubmit = async () => {
    const items = manualForm.items.filter((i) => i.name && i.price);
    if (!manualForm.customerName || !manualForm.customerEmail || !items.length) return;
    setSavingManual(true);
    const res = await fetch("/api/admin/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: manualForm.customerName,
        customerEmail: manualForm.customerEmail,
        address: manualForm.address,
        notes: manualForm.notes,
        items: items.map((i) => ({ name: i.name, price: parseFloat(i.price), quantity: Math.max(1, parseInt(i.quantity) || 1) })),
      }),
    });
    const data = await res.json();
    if (data?.id) setOrders((prev) => [mapOrder(data), ...prev]);
    setManualForm(emptyManualForm);
    setShowManual(false);
    setSavingManual(false);
  };

  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === "všetky" || o.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.email.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  if (dataLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Objednávky</h1>
          <p className="text-gray-400 text-sm mt-1">{orders.length} objednávok celkovo</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowManual(true)}
            className="flex items-center gap-2 px-4 py-2.5 gradient-btn text-white rounded-xl text-sm font-semibold shadow-md shadow-purple-200">
            <Plus size={15} /> Nová objednávka
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Hľadať objednávku..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["všetky", ...statusOptions] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${
                filterStatus === s ? "gradient-btn text-white shadow-md shadow-purple-200" : "bg-white border border-gray-200 text-gray-500 hover:border-purple-300"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-purple-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="px-6 py-4 text-left">ID</th>
                <th className="px-6 py-4 text-left">Zákazník</th>
                <th className="px-6 py-4 text-left">Dátum</th>
                <th className="px-6 py-4 text-right">Suma</th>
                <th className="px-6 py-4 text-center">Stav</th>
                <th className="px-6 py-4 text-right">Akcie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-purple-50/40 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      {order.id}
                      {order.notes && <StickyNote size={11} className="text-amber-400" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-800">{order.customer}</p>
                    <p className="text-xs text-gray-400">{order.email}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{order.date}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">{order.total.toFixed(2)} €</td>
                  <td className="px-6 py-4 text-center">
                    <div className="relative inline-block">
                      <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                        className={`appearance-none pr-6 pl-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-purple-400 ${statusStyle[order.status]}`}>
                        {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openDetail(order)} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Detail">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => printInvoice(order)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="PDF faktúra">
                        <FileText size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-16 text-gray-400">Žiadne objednávky</div>}
        </div>
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">{detail.id}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{detail.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => printInvoice(detail)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <FileText size={13} /> PDF
                </button>
                <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Zákazník</p>
                <p className="font-semibold text-gray-800">{detail.customer}</p>
                <p className="text-sm text-gray-500">{detail.email}</p>
                <p className="text-sm text-gray-400 mt-1">{detail.address}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Položky</p>
                <div className="space-y-2">
                  {detail.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm bg-gray-50 rounded-xl px-4 py-2.5">
                      <span className="text-gray-700">{item.name} × {item.quantity}</span>
                      <span className="font-semibold text-gray-900">{(item.price * item.quantity).toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-gray-100 font-bold text-gray-900">
                  <span>Celkom</span>
                  <span className="gradient-text">{detail.total.toFixed(2)} €</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Zmena stavu</p>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((s) => (
                    <button key={s} onClick={() => updateStatus(detail.id, s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${
                        detail.status === s ? `${statusStyle[s]} ring-2 ring-offset-1 ring-current` : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Interná poznámka</p>
                <textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)} rows={3}
                  placeholder="Zadajte internú poznámku..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
                <button onClick={saveNote} disabled={savingNote}
                  className="mt-2 px-4 py-2 gradient-btn text-white rounded-xl text-xs font-bold shadow-sm">
                  {savingNote ? "Ukladá..." : "Uložiť poznámku"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Order Modal */}
      {showManual && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-extrabold text-gray-900">Nová objednávka</h2>
              <button onClick={() => setShowManual(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Meno *</label>
                  <input value={manualForm.customerName} onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="Meno zákazníka" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">E-mail *</label>
                  <input type="email" value={manualForm.customerEmail} onChange={(e) => setManualForm({ ...manualForm, customerEmail: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="email@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Adresa</label>
                <input value={manualForm.address} onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="Ulica, Mesto, PSČ" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Položky *</label>
                  <button onClick={() => setManualForm({ ...manualForm, items: [...manualForm.items, { name: "", price: "", quantity: "1" }] })}
                    className="text-xs text-purple-600 hover:underline font-semibold flex items-center gap-1">
                    <Plus size={12} /> Pridať
                  </button>
                </div>
                <div className="space-y-2">
                  {manualForm.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-5 gap-2 items-center">
                      <input value={item.name} placeholder="Názov" onChange={(e) => {
                        const items = manualForm.items.map((it, j) => j === i ? { ...it, name: e.target.value } : it); setManualForm({ ...manualForm, items });
                      }} className="col-span-2 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                      <input type="number" value={item.price} placeholder="Cena" onChange={(e) => {
                        const items = manualForm.items.map((it, j) => j === i ? { ...it, price: e.target.value } : it); setManualForm({ ...manualForm, items });
                      }} className="col-span-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                      <input type="number" min="1" value={item.quantity} onChange={(e) => {
                        const items = manualForm.items.map((it, j) => j === i ? { ...it, quantity: e.target.value } : it); setManualForm({ ...manualForm, items });
                      }} className="col-span-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                      {manualForm.items.length > 1 && (
                        <button onClick={() => setManualForm({ ...manualForm, items: manualForm.items.filter((_, j) => j !== i) })}
                          className="p-1.5 text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-gray-400">Stĺpce: Názov · Cena (€) · Množstvo</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Poznámka</label>
                <textarea value={manualForm.notes} onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })} rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" placeholder="Interná poznámka..." />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button onClick={() => setShowManual(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                Zrušiť
              </button>
              <button onClick={handleManualSubmit} disabled={savingManual}
                className="flex-1 py-3 gradient-btn text-white rounded-xl text-sm font-bold shadow-md shadow-purple-200">
                {savingManual ? "Vytvára sa..." : "Vytvoriť objednávku"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
