"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useUserAuth } from "@/context/UserAuthContext";
import { useToast } from "@/context/ToastContext";
import { ShoppingCart, User, LogOut, ChevronDown, Menu, X, Sun, Moon, Globe } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/password-changed"];

export default function Header() {
  const { totalItems, openCart } = useCart();
  const { user, logout } = useUserAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (AUTH_ROUTES.includes(pathname) || pathname.startsWith("/admin")) return null;

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileOpen(false);
    showToast(t("nav_loggedOut"), "info");
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/90 backdrop-blur-md border-b border-purple-100 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-extrabold gradient-text">OurStone</span>
            </Link>

            <div className="flex items-center gap-2">
              {/* User — desktop */}
              {user ? (
                <div className="hidden md:block relative" ref={dropdownRef}>
                  <button onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-100 dark:border-[#2d2a45] hover:border-purple-300 transition-colors">
                    <div className="w-7 h-7 rounded-full gradient-btn flex items-center justify-center text-white text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 max-w-24 truncate">
                      {user.name.split(" ")[0]}
                    </span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1a1826] rounded-2xl shadow-lg border border-purple-50 dark:border-[#2d2a45] py-1.5 z-50">
                      <div className="px-4 py-2.5 border-b border-gray-50 dark:border-[#2d2a45]">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <Link href="/account" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-[#1e1a35] hover:text-purple-700 transition-colors">
                        <User size={15} /> {t("nav_myAccount")}
                      </Link>
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors">
                        <LogOut size={15} /> {t("nav_logout")}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login"
                  className="hidden md:flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-purple-600 transition-colors">
                  <User size={15} /> {t("nav_login")}
                </Link>
              )}

              {/* Language toggle */}
              <button
                onClick={() => setLang(lang === "sk" ? "en" : "sk")}
                aria-label="Switch language"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-[#2d2a45] text-xs font-bold text-gray-500 dark:text-gray-400 hover:border-purple-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                <Globe size={13} />
                {lang === "sk" ? "EN" : "SK"}
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                aria-label={theme === "dark" ? t("nav_lightMode") : t("nav_darkMode")}
                className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Cart */}
              <button
                onClick={openCart}
                aria-label={t("minicart_close")}
                className="relative flex items-center gap-2 px-4 py-2 gradient-btn text-white rounded-full text-sm font-semibold shadow-md shadow-purple-200">
                <ShoppingCart size={16} />
                <span className="hidden sm:inline">{t("nav_cart")}</span>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Avatar — mobile quick link to account */}
              {user && (
                <Link href="/account" className="md:hidden w-8 h-8 rounded-full gradient-btn flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </Link>
              )}

              {/* Hamburger */}
              <button onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-[#1e1a35] transition-colors">
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b border-purple-100 dark:border-gray-700 shadow-xl px-4 py-3 space-y-1"
            onClick={(e) => e.stopPropagation()}>
            {!user && (
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-800 hover:text-purple-700 transition-colors">
                <User size={16} /> {t("nav_login")}
              </Link>
            )}
            <button onClick={() => { toggleTheme(); setMobileOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              {theme === "dark" ? t("nav_lightMode") : t("nav_darkMode")}
            </button>
            <button
              onClick={() => { setLang(lang === "sk" ? "en" : "sk"); setMobileOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Globe size={16} />
              {lang === "sk" ? "EN" : "SK"}
            </button>

            <div className="border-t border-gray-100 pt-2">
              {user && (
                <>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-full gradient-btn flex items-center justify-center text-white font-bold shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link href="/account" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-[#1e1a35] hover:text-purple-700 transition-colors">
                    <User size={16} /> {t("nav_myAccount")}
                  </Link>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors">
                    <LogOut size={16} /> {t("nav_logout")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
