"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const wrap = "min-h-screen flex items-center justify-center bg-linear-to-br from-violet-600 via-purple-600 to-pink-500 dark:from-[#1a0a2e] dark:via-[#1e0a3c] dark:to-[#2d0a4e] px-4";
  const card = "bg-white dark:bg-[#1a1826] rounded-3xl shadow-2xl p-8 w-full max-w-md";
  const input = "py-3 border border-gray-200 dark:border-[#2d2a45] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 dark:text-gray-200 text-sm bg-white dark:bg-[#14121f] placeholder-gray-400 dark:placeholder-gray-600";

  if (!token) {
    return (
      <div className={wrap}>
        <div className={`${card} text-center`}>
          <AlertCircle size={44} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">Neplatný odkaz</h1>
          <p className="text-gray-400 text-sm">Odkaz na obnovenie hesla je neplatný alebo expirovaný.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Heslá sa nezhodujú.");
      return;
    }
    if (password.length < 6) {
      setError("Heslo musí mať aspoň 6 znakov.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Nastala chyba.");
        setSubmitting(false);
      } else {
        router.push("/password-changed");
      }
    } catch {
      setError("Nastala chyba. Skús znova.");
      setSubmitting(false);
    }
  };

  return (
    <div className={wrap}>
      <div className={card}>
        <div className="text-center mb-8">
          <span className="text-3xl font-extrabold gradient-text">ShopSK</span>
          <p className="text-gray-400 text-sm mt-1">Nastavenie nového hesla</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Nové heslo
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                required
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className={`w-full pl-10 pr-10 ${input}`}
                placeholder="Minimálne 6 znakov"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Potvrdiť heslo
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                required
                type={showPass ? "text" : "password"}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                className={`w-full pl-10 pr-4 ${input}`}
                placeholder="Zopakuj heslo"
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
            {submitting ? "Ukladá sa..." : "Nastaviť nové heslo"}
          </button>
        </form>
      </div>
    </div>
  );
}
