"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Chyba pri odosielaní.");
      setSubmitting(false);
    } else {
      setSent(true);
    }
  };

  const wrap = "min-h-screen flex items-center justify-center bg-linear-to-br from-violet-600 via-purple-600 to-pink-500 dark:from-[#1a0a2e] dark:via-[#1e0a3c] dark:to-[#2d0a4e] px-4";
  const card = "bg-white dark:bg-[#1a1826] rounded-3xl shadow-2xl p-8 w-full max-w-md";
  const input = "w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-[#2d2a45] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 dark:text-gray-200 text-sm bg-white dark:bg-[#14121f] placeholder-gray-400 dark:placeholder-gray-600";

  if (sent) {
    return (
      <div className={wrap}>
        <div className={`${card} text-center`}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 dark:bg-green-900/20 mb-6">
            <CheckCircle size={44} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">Skontroluj svoj email</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-2">Poslali sme odkaz na obnovenie hesla na</p>
          <p className="font-bold text-purple-600 mb-6">{email}</p>
          <p className="text-sm text-gray-400 mb-8">Klikni na odkaz v emaili a nastav si nové heslo.</p>
          <Link href="/login"
            className="inline-flex items-center justify-center w-full py-3.5 gradient-btn text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-200 dark:shadow-purple-900/40">
            Späť na prihlásenie
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={wrap}>
      <div className={card}>
        <div className="text-center mb-8">
          <span className="text-3xl font-extrabold gradient-text">ShopSK</span>
          <p className="text-gray-400 text-sm mt-1">Obnova hesla</p>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
          Zadaj svoj email a pošleme ti odkaz na nastavenie nového hesla.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className={input}
                placeholder="jan@priklad.sk"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm px-3 py-2.5 rounded-xl">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full py-3.5 gradient-btn text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-200 dark:shadow-purple-900/40">
            {submitting ? "Odosiela sa..." : "Poslať odkaz na obnovenie"}
          </button>
        </form>

        <Link href="/login"
          className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-purple-600 mt-6 transition-colors">
          <ArrowLeft size={15} />
          Späť na prihlásenie
        </Link>
      </div>
    </div>
  );
}
