"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, User, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { useUserAuth } from "@/context/UserAuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function RegisterPage() {
  const { register, user } = useUserAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (user) router.replace("/account");
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError(t("register_passwordMismatch"));
      return;
    }
    if (form.password.length < 6) {
      setError(t("register_passwordTooShort"));
      return;
    }
    setSubmitting(true);
    const err = await register(form.name.trim(), form.email.trim(), form.password);
    if (err) {
      setError(err);
      setSubmitting(false);
    } else {
      setEmailSent(true);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setError("");
  };

  const inputClass = "w-full py-3 border border-gray-200 dark:border-[#2d2a45] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 dark:text-gray-200 text-sm bg-white dark:bg-[#14121f] placeholder-gray-400 dark:placeholder-gray-600";
  const labelClass = "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5";

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-violet-600 via-purple-600 to-pink-500 dark:from-[#1a0a2e] dark:via-[#1e0a3c] dark:to-[#2d0a4e] px-4">
        <div className="bg-white dark:bg-[#1a1826] rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 dark:bg-green-900/20 mb-6">
            <CheckCircle size={44} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">{t("register_checkEmail")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-2">{t("register_emailSentTo")}</p>
          <p className="font-bold text-purple-600 mb-6">{form.email}</p>
          <p className="text-sm text-gray-400 mb-8">{t("register_emailInstructions")}</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-3.5 gradient-btn text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-200 dark:shadow-purple-900/40"
          >
            {t("register_goToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-violet-600 via-purple-600 to-pink-500 dark:from-[#1a0a2e] dark:via-[#1e0a3c] dark:to-[#2d0a4e] px-4">
      <div className="bg-white dark:bg-[#1a1826] rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-600 transition-colors mb-6">
          <ArrowLeft size={14} />
          {t("register_backToShop")}
        </Link>
        <div className="text-center mb-8">
          <span className="text-3xl font-extrabold gradient-text">ShopSK</span>
          <p className="text-gray-400 text-sm mt-1">{t("register_title")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>{t("register_name")}</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input required value={form.name} onChange={set("name")}
                className={`${inputClass} pl-10 pr-4`}
                placeholder={t("register_namePh")} />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("register_email")}</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input required type="email" value={form.email} onChange={set("email")}
                className={`${inputClass} pl-10 pr-4`}
                placeholder={t("register_emailPh")} />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("register_password")}</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input required type={showPass ? "text" : "password"} value={form.password} onChange={set("password")}
                className={`${inputClass} pl-10 pr-10`}
                placeholder={t("register_passwordHint")} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("register_confirmPassword")}</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input required type={showPass ? "text" : "password"} value={form.confirm} onChange={set("confirm")}
                className={`${inputClass} pl-10 pr-4`}
                placeholder={t("register_confirmPh")} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm px-3 py-2.5 rounded-xl">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full py-3.5 gradient-btn text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-200 dark:shadow-purple-900/40 mt-2">
            {submitting ? t("register_submitting") : t("register_submit")}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          {t("register_hasAccount")}{" "}
          <Link href="/login" className="text-purple-600 font-semibold hover:underline">
            {t("register_loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
