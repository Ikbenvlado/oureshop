"use client";

import { useState, useEffect } from "react";
import { Cookie, X, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const STORAGE_KEY = "oureshop_cookie_consent";

type Consent = "all" | "essential";

export default function CookieBanner() {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  function accept(consent: Consent) {
    localStorage.setItem(STORAGE_KEY, consent);
    setVisible(false);
    if (consent === "all") window.dispatchEvent(new Event("cookie-consent-all"));
  }

  if (!visible) return null;

  const sk = lang === "sk";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] md:bottom-6 md:left-6 md:right-auto md:max-w-sm">
      <div className="bg-white dark:bg-[#1a1826] border border-purple-100 dark:border-[#2d2a45] shadow-2xl md:rounded-2xl p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl gradient-btn flex items-center justify-center flex-shrink-0">
            <Cookie size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">
              {sk ? "Používame cookies" : "We use cookies"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
              {sk
                ? "Nevyhnutné cookies zabezpečujú chod webu (prihlásenie, košík). Analytické cookies nám pomáhajú zlepšovať služby."
                : "Essential cookies keep the site running (login, cart). Analytics cookies help us improve our services."}
            </p>
          </div>
        </div>

        {/* Privacy link */}
        <a
          href="/ochrana-osobnych-udajov"
          className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline mb-4"
        >
          <ShieldCheck size={11} />
          {sk ? "Ochrana osobných údajov" : "Privacy Policy"}
        </a>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => accept("essential")}
            className="flex-1 py-2 px-3 rounded-xl border border-gray-200 dark:border-[#2d2a45] text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#14121f] transition-colors"
          >
            {sk ? "Len nevyhnutné" : "Essential only"}
          </button>
          <button
            onClick={() => accept("all")}
            className="flex-1 py-2 px-3 rounded-xl gradient-btn text-white text-xs font-semibold transition-opacity hover:opacity-90"
          >
            {sk ? "Prijať všetky" : "Accept all"}
          </button>
        </div>
      </div>
    </div>
  );
}
