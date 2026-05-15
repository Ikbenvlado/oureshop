import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext";
import { UserAuthProvider } from "@/context/UserAuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import Header from "@/components/Header";
import MiniCart from "@/components/MiniCart";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import CookieBanner from "@/components/CookieBanner";
import AnalyticsTracker from "@/components/AnalyticsTracker";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OurEshop — Slovenský online obchod",
  description: "Prémiové produkty za skvelé ceny. Rýchle doručenie po celom Slovensku.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('shopsk_theme'),d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t==null&&d))document.documentElement.classList.add('dark')}catch(e){}})()` }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="OurEshop" />
      </head>
      <body className={`${geist.variable} antialiased min-h-screen`}>
        <SessionProvider>
        <LanguageProvider>
        <ThemeProvider>
          <UserAuthProvider>
            <CartProvider>
              <FavoritesProvider>
                <ToastProvider>
                  <AnalyticsTracker />
                  <Header />
                  <MiniCart />
                  <div className="pb-14 md:pb-0">
                    {children}
                    <Footer />
                  </div>
                  <BottomNav />
                  <CookieBanner />
                </ToastProvider>
              </FavoritesProvider>
            </CartProvider>
          </UserAuthProvider>
        </ThemeProvider>
        </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
