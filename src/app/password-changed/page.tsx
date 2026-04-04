"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function PasswordChangedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-violet-600 via-purple-600 to-pink-500 dark:from-[#1a0a2e] dark:via-[#1e0a3c] dark:to-[#2d0a4e] px-4">
      <div className="bg-white dark:bg-[#1a1826] rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 dark:bg-green-900/20 mb-6">
          <CheckCircle size={44} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">Heslo bolo zmenené!</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
          Tvoje heslo bolo úspešne aktualizované.<br />
          Teraz sa môžeš prihlásiť s novým heslom.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full py-3.5 gradient-btn text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-200 dark:shadow-purple-900/40"
        >
          Prihlásiť sa
        </Link>
      </div>
    </div>
  );
}
