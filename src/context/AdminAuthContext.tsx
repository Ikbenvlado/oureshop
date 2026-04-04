"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { type AdminRole, isAdminRole, can } from "@/lib/permissions";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  role: AdminRole | null;
  adminName: string;
  loading: boolean;
  can: (feature: string) => boolean;
  login: (email: string, password: string) => Promise<boolean | string>;
  logout: () => Promise<void>;
  updateAdminName: (name: string) => Promise<string | null>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [adminName, setAdminName] = useState("");
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    const r = (session?.user as any)?.role;
    const authenticated = isAdminRole(r);
    setIsAuthenticated(authenticated);
    setIsSuperAdmin(r === "super_admin");
    setRole(authenticated ? r : null);
    setAdminName(authenticated ? (session?.user?.name || "Admin") : "");
    setLoading(false);
  }, [session, status]);

  const login = async (email: string, password: string): Promise<boolean | string> => {
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      const res = await fetch(`/api/auth/check-lockout?email=${encodeURIComponent(email)}`);
      const { locked, remainingMinutes } = await res.json();
      if (locked) return `Príliš veľa pokusov. Skúste znova o ${remainingMinutes} min.`;
      return false;
    }
    const res = await fetch("/api/auth/session");
    const newSession = await res.json();
    const r = newSession?.user?.role;
    if (!isAdminRole(r)) { await signOut({ redirect: false }); return false; }
    setIsAuthenticated(true);
    setIsSuperAdmin(r === "super_admin");
    setRole(r);
    setAdminName(newSession?.user?.name || "Admin");
    // Record session
    fetch("/api/admin/sessions", { method: "POST" })
      .then((r) => r.json())
      .then((d) => { if (d.sessionId) setSessionId(d.sessionId); })
      .catch(() => {});
    return true;
  };

  const logout = async () => {
    await fetch("/api/admin/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(() => {});
    await signOut({ redirect: false });
    setIsAuthenticated(false);
    setIsSuperAdmin(false);
    setRole(null);
    setAdminName("");
    setSessionId(null);
  };

  const updateAdminName = async (name: string): Promise<string | null> => {
    if (!session?.user?.id) return "Nie si prihlásený.";
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) { const data = await res.json(); return data.error; }
    setAdminName(name);
    await update({ name });
    return null;
  };

  const canDo = (feature: string) => can(role ?? "", feature);

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, isSuperAdmin, role, adminName, loading, can: canDo, login, logout, updateAdminName }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
