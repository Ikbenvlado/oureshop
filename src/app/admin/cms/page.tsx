"use client";

import { useState, useEffect } from "react";
import { Plus, FileText, Save, Trash2, X, Globe } from "lucide-react";

interface Page { slug: string; title: string; content: string; updatedAt: string; }

const DEFAULT_SLUGS = [
  { slug: "o-nas", title: "O nás" },
  { slug: "obchodne-podmienky", title: "Obchodné podmienky" },
  { slug: "ochrana-osobnych-udajov", title: "Ochrana osobných údajov" },
  { slug: "reklamacie", title: "Reklamácie" },
  { slug: "kontakt", title: "Kontakt" },
];

export default function AdminCmsPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Page | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => { fetchPages(); }, []);

  async function fetchPages() {
    setLoading(true);
    const res = await fetch("/api/admin/cms");
    const data = await res.json();
    setPages(data.pages ?? []);
    setLoading(false);
  }

  function selectPage(p: Page) {
    setSelected(p);
    setEditTitle(p.title);
    setEditContent(p.content);
    setSaved(false);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    const res = await fetch("/api/admin/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: selected.slug, title: editTitle, content: editContent }),
    });
    const data = await res.json();
    if (res.ok) {
      setPages((prev) => prev.map((p) => p.slug === selected.slug ? data.page : p));
      setSelected(data.page);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function handleDelete(slug: string) {
    if (!confirm("Zmazať stránku?")) return;
    await fetch("/api/admin/cms", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
    setPages((prev) => prev.filter((p) => p.slug !== slug));
    if (selected?.slug === slug) setSelected(null);
  }

  async function handleCreate(slug: string, title: string) {
    const res = await fetch("/api/admin/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, title, content: "" }),
    });
    const data = await res.json();
    if (res.ok) {
      setPages((prev) => {
        const exists = prev.find((p) => p.slug === slug);
        return exists ? prev.map((p) => p.slug === slug ? data.page : p) : [...prev, data.page];
      });
      selectPage(data.page);
      setShowNew(false);
      setNewSlug(""); setNewTitle("");
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  const existingSlugs = new Set(pages.map((p) => p.slug));

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">CMS — Stránky</h1>
        <p className="text-gray-400 text-sm mt-1">Editácia obsahu statických stránok</p>
      </div>

      <div className="flex gap-6 min-h-[600px]">
        {/* Sidebar list */}
        <div className="w-64 shrink-0 space-y-1">
          {/* Default pages quick-create */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-2">Stránky</p>
          {DEFAULT_SLUGS.map(({ slug, title }) => {
            const exists = existingSlugs.has(slug);
            const isSelected = selected?.slug === slug;
            return (
              <div key={slug} className="flex items-center gap-1">
                <button onClick={() => { const p = pages.find((pg) => pg.slug === slug); if (p) selectPage(p); else handleCreate(slug, title); }}
                  className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${isSelected ? "bg-purple-600 text-white" : "bg-white text-gray-700 hover:bg-purple-50 border border-purple-50"}`}>
                  <FileText size={14} />
                  <span className="truncate">{title}</span>
                  {!exists && <span className="text-xs opacity-60 ml-auto">+</span>}
                </button>
                {exists && (
                  <button onClick={() => handleDelete(slug)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}

          {/* Custom pages */}
          {pages.filter((p) => !DEFAULT_SLUGS.some((d) => d.slug === p.slug)).map((p) => (
            <div key={p.slug} className="flex items-center gap-1">
              <button onClick={() => selectPage(p)}
                className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${selected?.slug === p.slug ? "bg-purple-600 text-white" : "bg-white text-gray-700 hover:bg-purple-50 border border-purple-50"}`}>
                <Globe size={14} />
                <span className="truncate">{p.title}</span>
              </button>
              <button onClick={() => handleDelete(p.slug)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          <button onClick={() => setShowNew(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-purple-600 hover:bg-purple-50 border border-dashed border-purple-200 transition-colors mt-2">
            <Plus size={14} /> Vlastná stránka
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 bg-white rounded-2xl border border-purple-50 shadow-sm overflow-hidden flex flex-col">
          {selected ? (
            <>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex-1 mr-4">
                  <input value={editTitle} onChange={(e) => { setEditTitle(e.target.value); setSaved(false); }}
                    className="text-base font-extrabold text-gray-900 bg-transparent focus:outline-none w-full" />
                  <p className="text-xs text-gray-400 font-mono">/{selected.slug}</p>
                </div>
                <button onClick={handleSave} disabled={saving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${saved ? "bg-green-100 text-green-700" : "gradient-btn text-white"} disabled:opacity-50`}>
                  <Save size={14} />
                  {saving ? "Ukladám..." : saved ? "Uložené!" : "Uložiť"}
                </button>
              </div>
              <textarea
                value={editContent}
                onChange={(e) => { setEditContent(e.target.value); setSaved(false); }}
                placeholder="Obsah stránky (HTML alebo plain text)..."
                className="flex-1 p-6 text-sm text-gray-700 font-mono focus:outline-none resize-none"
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FileText size={40} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm">Vyber stránku zo zoznamu</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New page modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-extrabold text-gray-900">Nová stránka</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Slug (URL)</label>
                <input value={newSlug} onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  placeholder="moja-stranka" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Názov</label>
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Moja stránka" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <button onClick={() => handleCreate(newSlug, newTitle)} disabled={!newSlug || !newTitle}
                className="w-full gradient-btn text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 mt-1">
                Vytvoriť
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
