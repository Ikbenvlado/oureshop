"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, Users, UserCog, LogOut, Settings, Crown, Tag, CreditCard, MessageSquare, BarChart2 } from "lucide-react";
import { AdminAuthProvider, useAdminAuth } from "@/context/AdminAuthContext";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, feature: "dashboard" },
  { href: "/admin/products", label: "Produkty", icon: Package, feature: "products" },
  { href: "/admin/orders", label: "Objednávky", icon: ShoppingBag, feature: "orders" },
  { href: "/admin/customers", label: "Zákazníci", icon: Users, feature: "customers" },
  { href: "/admin/coupons", label: "Kupóny", icon: Tag, feature: "coupons" },
  { href: "/admin/payments", label: "Platby", icon: CreditCard, feature: "payments" },
  { href: "/admin/reviews", label: "Recenzie", icon: MessageSquare, feature: "reviews" },
  { href: "/admin/analytics", label: "Analytika", icon: BarChart2, feature: "analytics" },
  { href: "/admin/admins", label: "Administrátori", icon: UserCog, feature: "admins" },
];

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
  support: "Podpora",
};

function AdminSidebar() {
  const { logout, adminName, isSuperAdmin, role, can } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const firstName = adminName.split(" ")[0];

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-gray-800">
        <span className="text-xl font-extrabold gradient-text">OurStone</span>
        <p className="text-xs text-gray-500 mt-1">Admin panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.filter(({ feature }) => can(feature)).map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                active ? "bg-purple-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-1">
        {firstName && (
          <Link
            href="/admin/settings"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
              pathname === "/admin/settings" ? "bg-gray-800" : "hover:bg-gray-800"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{firstName}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                {isSuperAdmin && <Crown size={10} className="text-amber-400" />}
                {roleLabel[role ?? ""] ?? "Admin"}
              </p>
            </div>
            <Settings size={14} className="text-gray-500 shrink-0" />
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
        >
          <LogOut size={18} />
          Odhlásiť sa
        </button>
      </div>
    </aside>
  );
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated && pathname !== "/admin" && pathname !== "/admin/login") {
      router.replace("/admin");
    }
  }, [isAuthenticated, loading, pathname, router]);

  const isLoginPage = pathname === "/admin" || pathname === "/admin/login";

  if (loading && !isLoginPage) return (
    <div className="flex items-center justify-center min-h-screen bg-purple-50">
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated && !isLoginPage) return null;
  if (isLoginPage) return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-purple-50 overflow-auto">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminGuard>{children}</AdminGuard>
    </AdminAuthProvider>
  );
}
