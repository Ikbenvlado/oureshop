"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, X, Star, Check, Search, Download, Upload, Tag } from "lucide-react";
import { Product } from "@/lib/products";

interface Variant { name: string; values: string; } // e.g. {name:"Veľkosť", values:"S,M,L,XL"}

function mapProduct(row: any): Product {
  return { ...row, inStock: row.inStock ?? row.in_stock, discount: row.discount ?? null, stock: row.stock ?? null, sku: row.sku ?? "" };
}

const emptyForm = {
  sku: "", name: "", nameEn: "", price: "", category: "", image: "", description: "", descriptionEn: "",
  rating: "4.5", reviews: "0", inStock: true, discount: "", stock: "",
};

function exportCSV(items: Product[]) {
  const header = ["ID", "SKU", "Názov", "Kategória", "Cena", "Zľava", "Sklad", "Dostupné", "Hodnotenie", "Recenzie"];
  const rows = items.map((p) => [
    p.id, p.sku ?? "", p.name, p.category, p.price, p.discount ?? "", p.stock ?? "", p.inStock ? "Áno" : "Nie", p.rating, p.reviews,
  ]);
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "produkty.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("všetky");
  const [filterStock, setFilterStock] = useState("všetky");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/products").then((r) => r.json()).then((data) => {
      setItems((data ?? []).map(mapProduct)); setDataLoading(false);
    });
  }, []);

  const openAdd = () => { setForm(emptyForm); setVariants([]); setEditing(null); setModal("add"); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ sku: p.sku ?? "", name: p.name, nameEn: (p as any).nameEn ?? "", price: String(p.price), category: p.category, image: p.image, description: p.description, descriptionEn: (p as any).descriptionEn ?? "", rating: String(p.rating), reviews: String(p.reviews), inStock: p.inStock, discount: p.discount ? String(p.discount) : "", stock: p.stock != null ? String(p.stock) : "" });
    setVariants((p as any).variants ?? []);
    setModal("edit");
  };
  const closeModal = () => { setModal(null); setEditing(null); setSaving(false); };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) return;
    setSaving(true);
    const payload = {
      sku: form.sku.trim() || null, name: form.name, nameEn: form.nameEn.trim() || null, price: parseFloat(form.price), category: form.category,
      image: form.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
      description: form.description, descriptionEn: form.descriptionEn.trim() || null, rating: parseFloat(form.rating), reviews: parseInt(form.reviews),
      stock: form.stock !== "" ? parseInt(form.stock) : null,
      inStock: form.stock !== "" ? parseInt(form.stock) > 0 : form.inStock,
      discount: form.discount ? parseFloat(form.discount) : null,
      variants: variants.length > 0 ? variants : null,
    };
    if (modal === "add") {
      const res = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data?.id) setItems((prev) => [...prev, mapProduct(data)]);
    } else if (modal === "edit" && editing) {
      await fetch("/api/admin/products", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, ...payload }) });
      setItems((prev) => prev.map((p) => p.id === editing.id ? mapProduct({ ...p, ...payload }) : p));
    }
    closeModal();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    await Promise.all(Array.from(selected).map((id) => fetch(`/api/admin/products?id=${id}`, { method: "DELETE" })));
    setItems((prev) => prev.filter((p) => !selected.has(p.id)));
    setSelected(new Set());
    setBulkDeleting(false);
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const toggleAll = () => {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((p) => p.id)));
  };

  const categories = useMemo(() => ["všetky", ...Array.from(new Set(items.map((p) => p.category))).sort()], [items]);

  const filtered = useMemo(() => items.filter((p) => {
    if (search) { const q = search.toLowerCase(); if (!p.name.toLowerCase().includes(q) && !p.sku?.toLowerCase().includes(q)) return false; }
    if (filterCategory !== "všetky" && p.category !== filterCategory) return false;
    if (filterStock === "skladom" && !p.inStock) return false;
    if (filterStock === "vypredané" && p.inStock) return false;
    if (filterStock === "málo" && (p.stock == null || p.stock > 10 || p.stock === 0)) return false;
    return true;
  }), [items, search, filterCategory, filterStock]);

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

  if (dataLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Produkty</h1>
          <p className="text-gray-400 text-sm mt-1">{filtered.length} z {items.length} produktov</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
            <Download size={14} /> CSV export
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 gradient-btn text-white rounded-xl text-sm font-semibold shadow-md shadow-purple-200">
            <Plus size={16} /> Pridať produkt
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Hľadať podľa názvu alebo SKU..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400" />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white">
          {categories.map((c) => <option key={c} value={c}>{c === "všetky" ? "Všetky kategórie" : c}</option>)}
        </select>
        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
          {[["všetky", "Všetky"], ["skladom", "Skladom"], ["vypredané", "Vypredané"], ["málo", "Málo ks"]].map(([value, label]) => (
            <button key={value} onClick={() => setFilterStock(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterStock === value ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-2xl px-5 py-3 mb-4">
          <p className="text-sm font-semibold text-purple-800">{selected.size} produktov vybraných</p>
          <button onClick={handleBulkDelete} disabled={bulkDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors">
            <Trash2 size={14} /> {bulkDeleting ? "Mazanie..." : "Zmazať vybrané"}
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-purple-50 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <th className="px-4 py-4 text-left">
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll} className="w-4 h-4 accent-purple-600" />
              </th>
              <th className="px-4 py-4 text-left">Produkt</th>
              <th className="px-4 py-4 text-left">Kategória</th>
              <th className="px-4 py-4 text-right">Cena</th>
              <th className="px-4 py-4 text-center">Hodnotenie</th>
              <th className="px-4 py-4 text-center">Sklad</th>
              <th className="px-4 py-4 text-right">Akcie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">Žiadne produkty nevyhovujú filtru.</td></tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className={`hover:bg-purple-50/40 transition-colors ${selected.has(p.id) ? "bg-purple-50" : ""}`}>
                <td className="px-4 py-4">
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="w-4 h-4 accent-purple-600" />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-purple-50 shrink-0">
                      <Image src={p.image} alt={p.name} fill className="object-cover" sizes="40px" />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800 line-clamp-1">{p.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {p.sku && <span className="text-xs text-gray-400 font-mono">{p.sku}</span>}
                        {(p as any).variants?.length > 0 && (
                          <span className="text-xs text-purple-500 flex items-center gap-0.5"><Tag size={10} /> varianty</span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full">{p.category}</span>
                </td>
                <td className="px-4 py-4 text-right font-bold text-gray-900">
                  {p.discount ? (
                    <div>
                      <span className="text-xs text-gray-400 line-through block">{p.price.toFixed(2)} €</span>
                      <span>{(p.price * (1 - p.discount / 100)).toFixed(2)} €</span>
                    </div>
                  ) : `${p.price.toFixed(2)} €`}
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-gray-600">{p.rating}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  {p.stock != null ? (
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${p.stock === 0 ? "bg-red-100 text-red-600" : p.stock <= 5 ? "bg-orange-100 text-orange-600" : p.stock <= 10 ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-700"}`}>
                      {p.stock === 0 ? "Vypredané" : `${p.stock} ks`}
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${p.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {p.inStock ? <><Check size={11} /> Skladom</> : "Vypredané"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"><Pencil size={15} /></button>
                    <button onClick={() => setDeleteId(p.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-extrabold text-gray-900">{modal === "add" ? "Pridať produkt" : "Upraviť produkt"}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className={labelClass}>Kód výrobku (SKU)</label>
                <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={`${inputClass} font-mono`} placeholder="SKU-000001 (prázdne = auto)" />
              </div>
              <div><label className={labelClass}>Názov *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Názov produktu" />
              </div>
              <div><label className={labelClass}>Názov (EN)</label>
                <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className={inputClass} placeholder="Product name in English" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Cena (€) *</label>
                  <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} placeholder="49.99" />
                </div>
                <div><label className={labelClass}>Kategória *</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} placeholder="Elektronika" />
                </div>
              </div>
              <div><label className={labelClass}>URL obrázka</label>
                <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className={inputClass} placeholder="https://..." />
              </div>
              <div><label className={labelClass}>Popis</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} resize-none`} rows={3} placeholder="Popis produktu..." />
              </div>
              <div><label className={labelClass}>Popis (EN)</label>
                <textarea value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} className={`${inputClass} resize-none`} rows={3} placeholder="Product description in English..." />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className={labelClass}>Hodnotenie</label>
                  <input type="number" step="0.1" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className={inputClass} />
                </div>
                <div><label className={labelClass}>Počet recenzií</label>
                  <input type="number" min="0" value={form.reviews} onChange={(e) => setForm({ ...form, reviews: e.target.value })} className={inputClass} />
                </div>
                <div><label className={labelClass}>Zľava (%)</label>
                  <input type="number" step="1" min="0" max="100" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className={inputClass} placeholder="napr. 10" />
                </div>
              </div>
              <div><label className={labelClass}>Počet ks na sklade</label>
                <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputClass} placeholder="prázdne = len skladom / nie" />
              </div>
              {form.stock === "" && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.inStock} onChange={(e) => setForm({ ...form, inStock: e.target.checked })} className="w-4 h-4 accent-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Dostupné skladom</span>
                </label>
              )}

              {/* Variants */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className={labelClass + " mb-0"}>Varianty (napr. Veľkosť, Farba)</label>
                  <button onClick={() => setVariants([...variants, { name: "", values: "" }])}
                    className="text-xs text-purple-600 hover:underline font-semibold flex items-center gap-1">
                    <Plus size={12} /> Pridať variant
                  </button>
                </div>
                {variants.length === 0 && <p className="text-xs text-gray-400">Žiadne varianty</p>}
                <div className="space-y-2">
                  {variants.map((v, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input value={v.name} placeholder="Názov (napr. Veľkosť)" onChange={(e) => { const vv = [...variants]; vv[i].name = e.target.value; setVariants(vv); }}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                      <input value={v.values} placeholder="Hodnoty (S,M,L,XL)" onChange={(e) => { const vv = [...variants]; vv[i].values = e.target.value; setVariants(vv); }}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                      <button onClick={() => setVariants(variants.filter((_, j) => j !== i))} className="p-1.5 text-gray-300 hover:text-red-400"><X size={14} /></button>
                    </div>
                  ))}
                </div>
                {variants.length > 0 && <p className="text-xs text-gray-400 mt-1">Hodnoty oddeľujte čiarkou, napr. S,M,L,XL</p>}
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button onClick={closeModal} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">Zrušiť</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-3 gradient-btn text-white rounded-xl text-sm font-bold shadow-md shadow-purple-200">
                {saving ? "Ukladá sa..." : modal === "add" ? "Pridať" : "Uložiť"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={24} className="text-red-400" /></div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Zmazať produkt?</h3>
            <p className="text-sm text-gray-400 mb-6">Táto akcia sa nedá vrátiť späť.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">Zrušiť</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors">Zmazať</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
