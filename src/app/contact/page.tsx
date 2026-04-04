"use client";

import { useState } from "react";
import { Mail, User, MessageSquare, CheckCircle, AlertCircle, Send } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function ContactPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ meno: "", email: "", sprava: "" });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ ok: true, text: t("contact_success") });
        setForm({ meno: "", email: "", sprava: "" });
      } else {
        setResult({ ok: false, text: data.error ?? t("contact_error") });
      }
      setTimeout(() => setResult(null), 5000);
    } catch {
      setResult({ ok: false, text: t("contact_error") });
    }

    setSending(false);
  };

  const inputClass = "w-full px-4 py-3 border border-gray-200 dark:border-[#2d2a45] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 dark:text-gray-200 text-sm bg-white dark:bg-[#14121f] placeholder-gray-400 dark:placeholder-gray-600";

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{t("contact_title")}</h1>
        <p className="text-gray-400 text-sm">{t("contact_subtitle")}</p>
      </div>

      <div className="bg-white dark:bg-[#1a1826] rounded-3xl border border-purple-50 dark:border-[#2d2a45] shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                {t("contact_name")}
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  value={form.meno}
                  onChange={(e) => setForm({ ...form, meno: e.target.value })}
                  className={`${inputClass} pl-10`}
                  placeholder="Ján Novák"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                {t("contact_email")}
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`${inputClass} pl-10`}
                  placeholder="jan@priklad.sk"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              {t("contact_message")}
            </label>
            <div className="relative">
              <MessageSquare size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
              <textarea
                required
                rows={5}
                value={form.sprava}
                onChange={(e) => setForm({ ...form, sprava: e.target.value })}
                className={`${inputClass} pl-10 resize-none`}
                placeholder={t("contact_messagePh")}
              />
            </div>
          </div>

          {result && (
            <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl ${
              result.ok
                ? "bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 text-green-700 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 text-red-600 dark:text-red-400"
            }`}>
              {result.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {result.text}
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 py-3.5 gradient-btn text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-200"
          >
            <Send size={16} />
            {sending ? t("contact_submitting") : t("contact_submit")}
          </button>
        </form>
      </div>
    </main>
  );
}
