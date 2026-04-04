"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";
import { useUserAuth } from "@/context/UserAuthContext";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
  const { login, user } = useUserAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace("/account");
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const err = await login(email, password);
    if (!err) {
      showToast(t("login_success"));
      router.push("/account");
    } else {
      if (err.includes("Príliš veľa") || err.includes("Skúste znova")) {
        setError(err);
      } else {
        setError(t("login_wrongCredentials"));
      }
      setSubmitting(false);
    }
  };

  const inputClass = "w-full py-3 border border-gray-200 dark:border-[#2d2a45] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 dark:text-gray-200 text-sm bg-white dark:bg-[#14121f] placeholder-gray-400 dark:placeholder-gray-600";

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-violet-600 via-purple-600 to-pink-500 dark:from-[#1a0a2e] dark:via-[#1e0a3c] dark:to-[#2d0a4e] px-4">
      <div className="bg-white dark:bg-[#1a1826] rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-600 transition-colors mb-6">
          <ArrowLeft size={14} />
          {t("login_backToShop")}
        </Link>
        <div className="text-center mb-8">
          <span className="text-3xl font-extrabold gradient-text">ShopSK</span>
          <p className="text-gray-400 text-sm mt-1">{t("login_title")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" aria-label={t("login_title")} noValidate>
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              {t("login_email")}
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                id="login-email"
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className={`${inputClass} pl-10 pr-4`}
                placeholder={t("login_emailPh")}
                aria-required="true"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              {t("login_password")}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                id="login-password"
                required
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className={`${inputClass} pl-10 pr-10`}
                placeholder={t("login_passwordPh")}
                aria-required="true"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label={showPass ? t("login_hidePassword") : t("login_showPassword")}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm px-3 py-2.5 rounded-xl">
              <AlertCircle size={15} aria-hidden="true" />
              {error}
            </div>
          )}

          <div className="text-right">
            <Link href="/forgot-password" className="text-xs text-purple-500 hover:underline font-medium">
              {t("login_forgot")}
            </Link>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-3.5 gradient-btn text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-200 dark:shadow-purple-900/40 mt-2">
            {submitting ? t("login_submitting") : t("login_submit")}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          {t("login_noAccount")}{" "}
          <Link href="/register" className="text-purple-600 font-semibold hover:underline">
            {t("login_register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
