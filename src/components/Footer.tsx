"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, ShoppingBag, MapPin } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/password-changed"];

export default function Footer() {
  const pathname = usePathname();
  const { t, lang } = useLanguage();

  if (AUTH_ROUTES.includes(pathname) || pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-16 bg-white dark:bg-gray-900 border-t border-purple-100 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-extrabold gradient-text">OurEshop</span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
              {t("footer_desc")}
            </p>
            <div className="space-y-2">
              <a href="mailto:info@oureshop.fun"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-purple-600 transition-colors">
                <Mail size={14} />
                info@oureshop.fun
              </a>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin size={14} />
                {lang === "en" ? "Slovakia" : "Slovenská republika"}
              </div>
            </div>
          </div>

          {/* Shop links */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-4">
              {t("footer_shop")}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  {t("nav_products")}
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  {t("nav_cart")}
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  {t("checkout_title")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  {t("nav_contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Account links */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-4">
              {t("footer_myAccount")}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/login" className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  {t("nav_login")}
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  {lang === "en" ? "Register" : "Registrácia"}
                </Link>
              </li>
              <li>
                <Link href="/account" className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  {t("nav_myAccount")}
                </Link>
              </li>
              <li>
                <Link href="/account?tab=objednavky" className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  {t("account_orders")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Info links */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-4">
              {t("footer_info")}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/o-nas" className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  {t("about_title")}
                </Link>
              </li>
              <li>
                <Link href="/obchodne-podmienky" className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  {lang === "en" ? "Terms & Conditions" : "Obchodné podmienky"}
                </Link>
              </li>
              <li>
                <Link href="/ochrana-osobnych-udajov" className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  {lang === "en" ? "Privacy Policy" : "Ochrana osobných údajov"}
                </Link>
              </li>
              <li>
                <Link href="/reklamacie" className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  {lang === "en" ? "Returns" : "Reklamácie"}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-purple-50 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} OurEshop.{" "}
            {lang === "en" ? "All rights reserved." : "Všetky práva vyhradené."}
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <ShoppingBag size={12} className="text-purple-400" />
              {t("footer_secureShopping")}
            </span>
            <span className="text-gray-200 dark:text-gray-700">|</span>
            <span className="text-xs text-gray-400">{t("footer_delivery")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
