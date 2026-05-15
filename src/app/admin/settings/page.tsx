"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { CheckCircle, AlertCircle, User, UserPlus, Store, Mail, Lock, Activity } from "lucide-react";

type Tab = "profile" | "users" | "shop" | "email" | "activity";

const inputCls = "w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 text-sm";
const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

function Msg({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <div className={`flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl ${msg.ok ? "bg-green-50 border border-green-100 text-green-700" : "bg-red-50 border border-red-100 text-red-600"}`}>
      {msg.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
      {msg.text}
    </div>
  );
}

export default function AdminSettingsPage() {
  const { adminName, updateAdminName, isSuperAdmin } = useAdminAuth();
  const [tab, setTab] = useState<Tab>("profile");

  // Profile tab
  const [name, setName] = useState(adminName);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Current email
  const [currentEmail, setCurrentEmail] = useState("");
  useEffect(() => {
    fetch("/api/admin/profile").then((r) => r.json()).then((d) => { if (d?.email) setCurrentEmail(d.email); }).catch(() => {});
  }, []);

  // Change email
  const [newEmailVal, setNewEmailVal] = useState("");
  const [emailPw, setEmailPw] = useState("");
  const [emailChangeSaving, setEmailChangeSaving] = useState(false);
  const [emailChangeMsg, setEmailChangeMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailChangeSaving(true); setEmailChangeMsg(null);
    const res = await fetch("/api/admin/change-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newEmail: newEmailVal, currentPassword: emailPw }),
    });
    const data = await res.json();
    if (!res.ok) { setEmailChangeMsg({ ok: false, text: data.error ?? "Chyba" }); }
    else { setEmailChangeMsg({ ok: true, text: "Email bol zmenený. Odhláste sa a prihláste znova." }); setCurrentEmail(newEmailVal); setNewEmailVal(""); setEmailPw(""); }
    setEmailChangeSaving(false);
  };

  // Change password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Create admin tab
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Shop tab
  const [shop, setShop] = useState({
    shop_name: "", shop_ico: "", shop_address: "", shop_vat_rate: "20",
    shop_email: "", shop_phone: "", shop_currency: "EUR",
  });
  const [shopSaving, setShopSaving] = useState(false);
  const [shopMsg, setShopMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Email tab
  const [emailSettings, setEmailSettings] = useState({
    email_from: "", email_footer: "", email_order_subject: "",
  });
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Activity tab
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activityView, setActivityView] = useState<"log" | "sessions">("log");
  useEffect(() => {
    if (tab !== "activity") return;
    setSessionsLoading(true);
    fetch("/api/admin/sessions").then((r) => r.json()).then((d) => { setSessions(d ?? []); setSessionsLoading(false); }).catch(() => setSessionsLoading(false));
    setLogsLoading(true);
    fetch("/api/admin/logs").then((r) => r.json()).then((d) => { setLogs(Array.isArray(d) ? d : []); setLogsLoading(false); }).catch(() => setLogsLoading(false));
  }, [tab]);

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then((d) => {
      const s = d.settings ?? {};
      setShop((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("shop_"))) }));
      setEmailSettings((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("email_"))) }));
    }).catch(() => {});
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true); setMsg(null);
    const err = await updateAdminName(name.trim());
    setMsg(err ? { ok: false, text: err } : { ok: true, text: "Meno bolo uložené." });
    if (!err) setTimeout(() => setMsg(null), 3000);
    setSaving(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwMsg({ ok: false, text: "Heslá sa nezhodujú." }); return; }
    if (newPw.length < 6) { setPwMsg({ ok: false, text: "Nové heslo musí mať aspoň 6 znakov." }); return; }
    setPwSaving(true); setPwMsg(null);
    const res = await fetch("/api/admin/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    const data = await res.json();
    if (!res.ok) { setPwMsg({ ok: false, text: data.error ?? "Chyba" }); }
    else { setPwMsg({ ok: true, text: "Heslo bolo zmenené." }); setCurrentPw(""); setNewPw(""); setConfirmPw(""); setTimeout(() => setPwMsg(null), 3000); }
    setPwSaving(false);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true); setCreateMsg(null);
    const res = await fetch("/api/admin/create-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail, password: newPassword, name: newName, role: newRole }),
    });
    const data = await res.json();
    if (!res.ok) { setCreateMsg({ ok: false, text: data.error ?? "Chyba" }); }
    else { setCreateMsg({ ok: true, text: `Používateľ ${newEmail} bol vytvorený.` }); setNewEmail(""); setNewPassword(""); setNewName(""); setTimeout(() => setCreateMsg(null), 4000); }
    setCreating(false);
  };

  const handleShopSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setShopSaving(true); setShopMsg(null);
    const res = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(shop) });
    setShopMsg(res.ok ? { ok: true, text: "Nastavenia uložené." } : { ok: false, text: "Chyba pri ukladaní." });
    if (res.ok) setTimeout(() => setShopMsg(null), 3000);
    setShopSaving(false);
  };

  const handleEmailSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSaving(true); setEmailMsg(null);
    const res = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(emailSettings) });
    setEmailMsg(res.ok ? { ok: true, text: "Nastavenia uložené." } : { ok: false, text: "Chyba pri ukladaní." });
    if (res.ok) setTimeout(() => setEmailMsg(null), 3000);
    setEmailSaving(false);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; superOnly?: boolean }[] = [
    { id: "profile", label: "Profil", icon: <User size={15} /> },
    { id: "activity", label: "Aktivita", icon: <Activity size={15} />, superOnly: true },
    { id: "users", label: "Používatelia", icon: <UserPlus size={15} />, superOnly: true },
    { id: "shop", label: "Obchod", icon: <Store size={15} /> },
    { id: "email", label: "E-mail", icon: <Mail size={15} /> },
  ];

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Nastavenia</h1>
      <p className="text-gray-400 text-sm mb-6">Konfigurácia obchodu a profilu</p>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl w-fit mb-8">
        {tabs.filter(({ superOnly }) => !superOnly || isSuperAdmin).map(({ id, label, icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === id ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === "profile" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center text-white text-xl font-extrabold">
                {(name || adminName).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900">{name || adminName || "Admin"}</p>
                <p className="text-xs text-gray-400">{isSuperAdmin ? "Super administrátor" : "Administrátor"}</p>
              </div>
            </div>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className={labelCls}>Meno a priezvisko</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ján Novák" />
              </div>
              <Msg msg={msg} />
              <button type="submit" disabled={saving} className="px-6 py-3 gradient-btn text-white rounded-xl font-bold text-sm shadow-md shadow-purple-200 disabled:opacity-50">
                {saving ? "Ukladá sa..." : "Uložiť meno"}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Mail size={18} className="text-blue-600" /></div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Zmena emailu</p>
                <p className="text-xs text-gray-400">Aktuálny: {currentEmail || "—"}</p>
              </div>
            </div>
            <form onSubmit={handleEmailChange} className="space-y-4">
              <div>
                <label className={labelCls}>Nový email</label>
                <input required type="email" value={newEmailVal} onChange={(e) => setNewEmailVal(e.target.value)} className={inputCls} placeholder="novy@oureshop.fun" />
              </div>
              <div>
                <label className={labelCls}>Aktuálne heslo (overenie)</label>
                <input required type="password" value={emailPw} onChange={(e) => setEmailPw(e.target.value)} className={inputCls} placeholder="••••••••" />
              </div>
              <Msg msg={emailChangeMsg} />
              <button type="submit" disabled={emailChangeSaving} className="px-6 py-3 gradient-btn text-white rounded-xl font-bold text-sm shadow-md shadow-purple-200 disabled:opacity-50">
                {emailChangeSaving ? "Mení sa..." : "Zmeniť email"}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Lock size={18} className="text-amber-600" /></div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Zmena hesla</p>
                <p className="text-xs text-gray-400">Zmeň si prihlasovacie heslo</p>
              </div>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className={labelCls}>Aktuálne heslo</label>
                <input required type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className={inputCls} placeholder="••••••••" />
              </div>
              <div>
                <label className={labelCls}>Nové heslo</label>
                <input required type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className={inputCls} placeholder="min. 6 znakov" />
              </div>
              <div>
                <label className={labelCls}>Potvrdiť nové heslo</label>
                <input required type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={inputCls} placeholder="••••••••" />
              </div>
              <Msg msg={pwMsg} />
              <button type="submit" disabled={pwSaving} className="px-6 py-3 gradient-btn text-white rounded-xl font-bold text-sm shadow-md shadow-purple-200 disabled:opacity-50">
                {pwSaving ? "Mení sa..." : "Zmeniť heslo"}
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Users Tab */}
      {tab === "users" && isSuperAdmin && (
        <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center"><UserPlus size={18} className="text-violet-600" /></div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Pridať používateľa</p>
              <p className="text-xs text-gray-400">Nový admin/editor/podpora</p>
            </div>
          </div>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div>
              <label className={labelCls}>Meno (voliteľné)</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className={inputCls} placeholder="Ján Novák" />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input required type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputCls} placeholder="admin@oureshop.fun" />
            </div>
            <div>
              <label className={labelCls}>Heslo</label>
              <input required type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} placeholder="min. 6 znakov" />
            </div>
            <div>
              <label className={labelCls}>Rola</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className={inputCls}>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
                <option value="editor">Editor (produkty, CMS)</option>
                <option value="support">Podpora (objednávky, zákazníci)</option>
              </select>
            </div>
            <Msg msg={createMsg} />
            <button type="submit" disabled={creating} className="px-6 py-3 gradient-btn text-white rounded-xl font-bold text-sm shadow-md shadow-purple-200 disabled:opacity-50">
              {creating ? "Vytvára sa..." : "Vytvoriť"}
            </button>
          </form>
        </div>
      )}

      {/* Activity Tab — super_admin only */}
      {tab === "activity" && isSuperAdmin && (
        <div className="space-y-6">
          {/* Sub-tabs */}
          <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl w-fit">
            <button onClick={() => setActivityView("log")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activityView === "log" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              Audit log
            </button>
            <button onClick={() => setActivityView("sessions")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activityView === "sessions" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              Prihlásenia
            </button>
          </div>

          {/* Audit Log */}
          {activityView === "log" && (
            <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
              <h2 className="text-base font-extrabold text-gray-900 mb-5">Audit log akcií</h2>
              {logsLoading ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
              ) : logs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Žiadne záznamy.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                        <th className="pb-3 text-left">Čas</th>
                        <th className="pb-3 text-left">Admin</th>
                        <th className="pb-3 text-left">Akcia</th>
                        <th className="pb-3 text-left">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {logs.map((l: any) => {
                        const dt = new Date(l.createdAt);
                        const actionColors: Record<string, string> = {
                          create: "bg-green-100 text-green-700",
                          update: "bg-blue-100 text-blue-700",
                          delete: "bg-red-100 text-red-700",
                          approve: "bg-emerald-100 text-emerald-700",
                          reject: "bg-orange-100 text-orange-700",
                          block: "bg-red-100 text-red-700",
                          unblock: "bg-green-100 text-green-700",
                          toggle: "bg-yellow-100 text-yellow-700",
                          note: "bg-gray-100 text-gray-600",
                        };
                        const cls = actionColors[l.action] ?? "bg-gray-100 text-gray-600";
                        return (
                          <tr key={l.id} className="hover:bg-purple-50/30">
                            <td className="py-3 pr-4 whitespace-nowrap">
                              <p className="font-medium text-gray-800">{dt.toLocaleDateString("sk-SK")}</p>
                              <p className="text-xs text-gray-400">{dt.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
                            </td>
                            <td className="py-3 pr-4 text-xs text-gray-600 max-w-35 truncate">{l.email}</td>
                            <td className="py-3 pr-4">
                              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{l.action}</span>
                              <p className="text-xs text-gray-400 mt-0.5">{l.entity}</p>
                            </td>
                            <td className="py-3 text-xs text-gray-600 max-w-55">{l.detail ?? "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Sessions */}
          {activityView === "sessions" && (
            <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
              <h2 className="text-base font-extrabold text-gray-900 mb-5">História prihlásení</h2>
              {sessionsLoading ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Žiadne záznamy.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                        <th className="pb-3 text-left">Admin</th>
                        <th className="pb-3 text-left">Prihlásenie</th>
                        <th className="pb-3 text-left">Odhlásenie</th>
                        <th className="pb-3 text-left">Trvanie</th>
                        <th className="pb-3 text-left">IP adresa</th>
                        <th className="pb-3 text-left">Zariadenie</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sessions.map((s: any) => {
                        const loginAt = new Date(s.loginAt);
                        const logoutAt = s.logoutAt ? new Date(s.logoutAt) : null;
                        const duration = logoutAt
                          ? (() => {
                              const diff = Math.floor((logoutAt.getTime() - loginAt.getTime()) / 1000);
                              if (diff < 60) return `${diff}s`;
                              if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
                              return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
                            })()
                          : null;
                        const browser = s.userAgent
                          ? s.userAgent.includes("Firefox") ? "Firefox"
                            : s.userAgent.includes("Chrome") ? "Chrome"
                            : s.userAgent.includes("Safari") ? "Safari"
                            : s.userAgent.includes("Edge") ? "Edge"
                            : "Iný"
                          : "—";
                        return (
                          <tr key={s.id} className="hover:bg-purple-50/30">
                            <td className="py-3 pr-4">
                              <p className="font-medium text-gray-800 text-xs">{s.user?.name || s.email}</p>
                              <p className="text-xs text-gray-400">{s.email}</p>
                            </td>
                            <td className="py-3 pr-4">
                              <p className="font-medium text-gray-800">{loginAt.toLocaleDateString("sk-SK")}</p>
                              <p className="text-xs text-gray-400">{loginAt.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" })}</p>
                            </td>
                            <td className="py-3 pr-4">
                              {logoutAt ? (
                                <>
                                  <p className="text-gray-700">{logoutAt.toLocaleDateString("sk-SK")}</p>
                                  <p className="text-xs text-gray-400">{logoutAt.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" })}</p>
                                </>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">● Aktívne</span>
                              )}
                            </td>
                            <td className="py-3 pr-4 text-gray-600">{duration ?? "—"}</td>
                            <td className="py-3 pr-4 font-mono text-xs text-gray-500">{s.ip || "—"}</td>
                            <td className="py-3 text-gray-600 text-xs">{browser}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Shop Tab */}
      {tab === "shop" && (
        <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
          <h2 className="text-base font-extrabold text-gray-900 mb-5">Informácie o obchode</h2>
          <form onSubmit={handleShopSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Názov obchodu</label>
                <input value={shop.shop_name} onChange={(e) => setShop({ ...shop, shop_name: e.target.value })} className={inputCls} placeholder="OurEshop" />
              </div>
              <div>
                <label className={labelCls}>IČO</label>
                <input value={shop.shop_ico} onChange={(e) => setShop({ ...shop, shop_ico: e.target.value })} className={inputCls} placeholder="12345678" />
              </div>
              <div>
                <label className={labelCls}>DPH (%)</label>
                <input type="number" min="0" max="100" step="1" value={shop.shop_vat_rate}
                  onChange={(e) => setShop({ ...shop, shop_vat_rate: e.target.value })} className={inputCls} placeholder="20" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Adresa firmy</label>
                <input value={shop.shop_address} onChange={(e) => setShop({ ...shop, shop_address: e.target.value })} className={inputCls} placeholder="Hlavná 1, 811 01 Bratislava" />
              </div>
              <div>
                <label className={labelCls}>Kontaktný e-mail</label>
                <input type="email" value={shop.shop_email} onChange={(e) => setShop({ ...shop, shop_email: e.target.value })} className={inputCls} placeholder="info@oureshop.fun" />
              </div>
              <div>
                <label className={labelCls}>Telefón</label>
                <input value={shop.shop_phone} onChange={(e) => setShop({ ...shop, shop_phone: e.target.value })} className={inputCls} placeholder="+421 900 000 000" />
              </div>
            </div>
            <Msg msg={shopMsg} />
            <button type="submit" disabled={shopSaving} className="px-6 py-3 gradient-btn text-white rounded-xl font-bold text-sm shadow-md shadow-purple-200 disabled:opacity-50">
              {shopSaving ? "Ukladá sa..." : "Uložiť nastavenia"}
            </button>
          </form>
        </div>
      )}

      {/* Email Tab */}
      {tab === "email" && (
        <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
          <h2 className="text-base font-extrabold text-gray-900 mb-5">E-mailové nastavenia</h2>
          <form onSubmit={handleEmailSave} className="space-y-4">
            <div>
              <label className={labelCls}>Odosielateľ (From)</label>
              <input value={emailSettings.email_from} onChange={(e) => setEmailSettings({ ...emailSettings, email_from: e.target.value })}
                className={inputCls} placeholder="OurEshop <noreply@oureshop.fun>" />
            </div>
            <div>
              <label className={labelCls}>Predmet e-mailu pri objednávke</label>
              <input value={emailSettings.email_order_subject} onChange={(e) => setEmailSettings({ ...emailSettings, email_order_subject: e.target.value })}
                className={inputCls} placeholder="Vaša objednávka bola prijatá" />
            </div>
            <div>
              <label className={labelCls}>Päta e-mailu</label>
              <textarea value={emailSettings.email_footer} onChange={(e) => setEmailSettings({ ...emailSettings, email_footer: e.target.value })}
                rows={4} className={`${inputCls} resize-none`}
                placeholder="OurEshop s.r.o. | Hlavná 1, Bratislava | IČO: 12345678" />
            </div>
            <Msg msg={emailMsg} />
            <button type="submit" disabled={emailSaving} className="px-6 py-3 gradient-btn text-white rounded-xl font-bold text-sm shadow-md shadow-purple-200 disabled:opacity-50">
              {emailSaving ? "Ukladá sa..." : "Uložiť nastavenia"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
