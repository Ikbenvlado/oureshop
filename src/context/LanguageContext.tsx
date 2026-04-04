"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Lang, TranslationKey } from "@/lib/translations";

// Category names stored in DB in Slovak → English translation map
const CATEGORY_MAP: Record<string, Record<Lang, string>> = {
  "Elektronika": { sk: "Elektronika", en: "Electronics" },
  "Oblečenie":   { sk: "Oblečenie",   en: "Clothing" },
  "Nábytok":     { sk: "Nábytok",     en: "Furniture" },
  "Kuchyňa":    { sk: "Kuchyňa",    en: "Kitchen" },
  "Doplnky":     { sk: "Doplnky",     en: "Accessories" },
  "Šport":       { sk: "Šport",       en: "Sport" },
};

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  tCat: (skName: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key as string,
  tCat: (sk) => sk,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("shopsk_lang") as Lang | null;
    if (saved === "sk" || saved === "en") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("shopsk_lang", l);
  };

  const t = (key: TranslationKey, vars?: Record<string, string | number>): string => {
    const dict = translations[lang] as Record<string, string>;
    const fallback = translations["sk"] as Record<string, string>;
    let str = dict[key] ?? fallback[key] ?? (key as string);
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  };

  const tCat = (skName: string): string => {
    return CATEGORY_MAP[skName]?.[lang] ?? skName;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tCat }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
