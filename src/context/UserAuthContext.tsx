"use client";

import {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from "react";
import { useSession, signIn, signOut } from "next-auth/react";

// ------- Types -------

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  zip: string;
}

export interface UserOrderItem {
  name: string;
  price: number;
  quantity: number;
}

export interface UserOrder {
  id: string;
  date: string;
  total: number;
  status: string;
  items: UserOrderItem[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  customerSeq: number | null;
  orders: UserOrder[];
  addresses: Address[];
}

// ------- Context type -------

interface UserAuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  updateProfile: (name: string, email: string, phone: string, newPassword?: string) => Promise<string | null>;
  addAddress: (address: Omit<Address, "id">) => Promise<string | null>;
  removeAddress: (id: string) => Promise<void>;
  addOrder: (
    order: Omit<UserOrder, "id">,
    checkoutData: { customerName: string; customerEmail: string; address: string },
    couponId?: string
  ) => Promise<string>;
}

const UserAuthContext = createContext<UserAuthContextType | null>(null);

// ------- Provider -------

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const [profileRes, addressesRes, ordersRes] = await Promise.all([
        fetch("/api/user/profile"),
        fetch("/api/user/addresses"),
        fetch("/api/user/orders"),
      ]);

      const profile = await profileRes.json();
      const addresses = await addressesRes.json();
      const orders = await ordersRes.json();

      if (profileRes.ok) {
        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          customerSeq: profile.customerSeq ?? null,
          addresses: Array.isArray(addresses) ? addresses : [],
          orders: Array.isArray(orders) ? orders : [],
        });
      }
    } catch {
      setUser(null);
    }
    setLoading(false);
  }, []);

  // Load full user data when session changes
  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user?.id) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Only load for customer role (or no role = customer)
    const role = (session.user as any).role;
    if (role === "admin" || role === "super_admin") {
      setUser(null);
      setLoading(false);
      return;
    }

    loadUser();
  }, [session, status, loadUser]);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    await loadUser();
  }, [user, loadUser]);

  const register = useCallback(async (
    name: string, email: string, password: string
  ): Promise<string | null> => {
    const res = await fetch("/api/user/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) return data.error;

    // Auto-login after registration
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) return result.error;
    return null;
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      // Check if email is locked out (NextAuth doesn't propagate custom error messages)
      const res = await fetch(`/api/auth/check-lockout?email=${encodeURIComponent(email)}`);
      const { locked, remainingMinutes } = await res.json();
      if (locked) return `Príliš veľa pokusov. Skúste znova o ${remainingMinutes} min.`;
      return "Nesprávny email alebo heslo.";
    }
    return null;
  }, []);

  const logout = useCallback(async () => {
    await signOut({ redirect: false });
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (
    name: string, email: string, phone: string, newPassword?: string
  ): Promise<string | null> => {
    if (!user) return "Nie si prihlásený.";

    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, newPassword }),
    });

    if (!res.ok) {
      const data = await res.json();
      return data.error;
    }

    setUser((prev) => prev ? { ...prev, name, phone, email } : prev);
    return null;
  }, [user]);

  const addAddress = useCallback(async (address: Omit<Address, "id">): Promise<string | null> => {
    if (!user) return "Nie si prihlásený.";

    const res = await fetch("/api/user/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(address),
    });

    if (!res.ok) {
      const data = await res.json();
      return data.error;
    }

    const newAddress = await res.json();
    setUser((prev) => prev
      ? { ...prev, addresses: [...prev.addresses, newAddress] }
      : prev
    );
    return null;
  }, [user]);

  const removeAddress = useCallback(async (id: string): Promise<void> => {
    if (!user) return;

    const res = await fetch(`/api/user/addresses?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setUser((prev) => prev
        ? { ...prev, addresses: prev.addresses.filter((a) => a.id !== id) }
        : prev
      );
    }
  }, [user]);

  const addOrder = useCallback(async (
    order: Omit<UserOrder, "id">,
    checkoutData: { customerName: string; customerEmail: string; address: string },
    couponId?: string
  ): Promise<string> => {
    const orderId = `ORD-${Date.now()}`;

    await fetch("/api/user/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        items: order.items,
        total: order.total,
        status: order.status,
        date: order.date,
        customerName: checkoutData.customerName,
        customerEmail: checkoutData.customerEmail,
        address: checkoutData.address,
        couponId: couponId ?? null,
      }),
    });

    if (user) {
      const newOrder: UserOrder = { ...order, id: orderId };
      setUser((prev) => prev
        ? { ...prev, orders: [newOrder, ...prev.orders] }
        : prev
      );
    }

    return orderId;
  }, [user]);

  return (
    <UserAuthContext.Provider
      value={{ user, loading, refreshUser, register, login, logout, updateProfile, addAddress, removeAddress, addOrder }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error("useUserAuth must be used within UserAuthProvider");
  return ctx;
}
