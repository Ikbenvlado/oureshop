"use client";

import { Mail, MapPin, ShoppingBag, Truck, Shield, Heart } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function AboutPage() {
  const { t, lang } = useLanguage();

  const values = [
    { icon: ShoppingBag, title: t("about_val1_title"), text: t("about_val1_text") },
    { icon: Truck,       title: t("about_val2_title"), text: t("about_val2_text") },
    { icon: Shield,      title: t("about_val3_title"), text: t("about_val3_text") },
    { icon: Heart,       title: t("about_val4_title"), text: t("about_val4_text") },
  ];

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <span className="inline-block text-xs font-bold text-purple-600 uppercase tracking-widest mb-3">
          {t("about_tag")}
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">
          {t("about_title")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed max-w-xl mx-auto">
          {t("about_subtitle")}
        </p>
      </div>

      {/* Story */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-purple-50 dark:border-gray-700 shadow-sm p-8 mb-8">
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">{t("about_story")}</h2>
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>{t("about_p1")}</p>
          <p>{t("about_p2")}</p>
          <p>{t("about_p3")}</p>
        </div>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        {values.map(({ icon: Icon, title, text }) => (
          <div key={title} className="bg-white dark:bg-gray-800 rounded-2xl border border-purple-50 dark:border-gray-700 shadow-sm p-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50 dark:bg-gray-700 mb-4">
              <Icon size={20} className="text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 rounded-3xl border border-purple-100 dark:border-gray-700 p-8">
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">{t("about_contact")}</h2>
        <div className="space-y-3">
          <a href="mailto:info@ourstone.fun"
            className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 transition-colors">
            <Mail size={16} className="text-purple-500 shrink-0" />
            info@ourstone.fun
          </a>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <MapPin size={16} className="text-purple-500 shrink-0" />
            {lang === "en" ? "Slovakia" : "Slovenská republika"}
          </div>
        </div>
        <div className="mt-6">
          <Link href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 gradient-btn text-white rounded-xl text-sm font-bold shadow-md shadow-purple-200">
            {t("about_writeUs")}
          </Link>
        </div>
      </div>
    </main>
  );
}
