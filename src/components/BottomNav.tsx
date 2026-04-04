"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, ShoppingCart, User } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useUserAuth } from "@/context/UserAuthContext";

const HIDDEN_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/password-changed", "/admin"];

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { totalItems } = useCart();
  const { favorites } = useFavorites();
  const { user } = useUserAuth();

  if (!user) return null;
  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null;

  const links = [
    { href: "/", icon: Home, label: t("nav_home"), badge: 0 },
    { href: "/account?tab=favorites", icon: Heart, label: t("nav_favorites"), badge: favorites.length },
    { href: "/cart", icon: ShoppingCart, label: t("nav_cart"), badge: totalItems },
    { href: "/account", icon: User, label: t("nav_account"), badge: 0 },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/account?tab=favorites") return pathname === "/account" && typeof window !== "undefined" && window.location.search.includes("tab=favorites");
    return pathname.startsWith(href.split("?")[0]);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-[#1a1826] border-t border-gray-200 dark:border-[#2d2a45] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {links.map(({ href, icon: Icon, label, badge }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors ${
                active
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <span className="relative">
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-purple-600 text-white text-[9px] font-bold px-1">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
