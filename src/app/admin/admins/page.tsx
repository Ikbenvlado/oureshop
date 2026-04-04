"use client";

import { useState, useEffect } from "react";
import { Shield, Crown, UserPlus, Pencil, Check, X } from "lucide-react";
import Link from "next/link";
import { useAdminAuth } from "@/context/AdminAuthContext";

type AdminProfile = { id: string; name: string; role: string };

export default function AdminAdminsPage() {
  const { isSuperAdmin } = useAdminAuth();
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/admins")
      .then((res) => res.json())
      .then((data) => {
        setAdmins((data as AdminProfile[]) ?? []);
        setLoading(false);
      });
  }, []);

  const startEdit = (a: AdminProfile) => {
    setEditingId(a.id);
    setEditName(a.name || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(true);

    const res = await fetch("/api/admin/update-admin-name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editName }),
    });

    if (res.ok) {
      setAdmins((prev) => prev.map((a) => a.id === id ? { ...a, name: editName.trim() } : a));
      setEditingId(null);
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Administrátori</h1>
          <p className="text-gray-400 text-sm mt-1">{admins.length} účtov s admin prístupom</p>
        </div>
        {isSuperAdmin && (
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 px-4 py-2.5 gradient-btn text-white rounded-xl text-sm font-bold shadow-md shadow-purple-200"
          >
            <UserPlus size={16} />
            Pridať admina
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-purple-50 shadow-sm overflow-hidden">
        {admins.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">Žiadni administrátori</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="px-6 py-4 text-left">Admin</th>
                <th className="px-6 py-4 text-left">Rola</th>
                <th className="px-6 py-4 text-left">ID</th>
                {isSuperAdmin && <th className="px-6 py-4 text-right">Akcie</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {admins.map((a) => {
                const isSA = a.role === "super_admin";
                const isEditing = editingId === a.id;
                const displayName = isEditing ? editName : a.name;
                const initials = displayName
                  ? displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
                  : "A";

                return (
                  <tr key={a.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-extrabold shrink-0 ${isSA ? "bg-amber-500" : "bg-purple-600"}`}>
                          {initials}
                        </div>
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(a.id);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            className="px-3 py-1.5 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 text-sm w-48"
                          />
                        ) : (
                          <span className="font-semibold text-gray-800">{a.name || "—"}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isSA ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold">
                          <Crown size={11} />
                          Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">
                          <Shield size={11} />
                          Administrátor
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{a.id}</td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => saveEdit(a.id)}
                              disabled={saving}
                              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(a)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
