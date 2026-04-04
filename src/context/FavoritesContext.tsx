"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUserAuth } from "@/context/UserAuthContext";

interface FavoritesContextType {
  favorites: number[];
  toggleFavorite: (productId: number) => Promise<void>;
  isFavorite: (productId: number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useUserAuth();
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    if (!user) { setFavorites([]); return; }

    fetch("/api/user/favorites")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setFavorites(data);
      });
  }, [user]);

  const toggleFavorite = async (productId: number) => {
    if (!user) return;

    const res = await fetch("/api/user/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });

    const data = await res.json();
    if (data.action === "removed") {
      setFavorites((prev) => prev.filter((id) => id !== productId));
    } else if (data.action === "added") {
      setFavorites((prev) => [...prev, productId]);
    }
  };

  const isFavorite = (productId: number) => favorites.includes(productId);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
