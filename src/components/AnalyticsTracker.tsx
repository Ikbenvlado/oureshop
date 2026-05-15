"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const ADMIN_ROLES = ["admin", "super_admin", "editor", "support"];
const CONSENT_KEY = "oureshop_cookie_consent";
const GA_ID = "G-REXZNJFPCL";

function hasAnalyticsConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "all";
  } catch {
    return false;
  }
}

function loadGoogleAnalytics() {
  if (document.getElementById("ga-script")) return;
  const script = document.createElement("script");
  script.id = "ga-script";
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  script.async = true;
  document.head.appendChild(script);
  const inline = document.createElement("script");
  inline.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`;
  document.head.appendChild(inline);
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (hasAnalyticsConsent()) loadGoogleAnalytics();
    const handler = () => loadGoogleAnalytics();
    window.addEventListener("cookie-consent-all", handler);
    return () => window.removeEventListener("cookie-consent-all", handler);
  }, []);

  useEffect(() => {
    if (pathname === lastTracked.current) return;
    if (pathname.startsWith("/admin")) return;

    const role = (session?.user as any)?.role;
    if (ADMIN_ROLES.includes(role)) return;

    if (!hasAnalyticsConsent()) return;

    lastTracked.current = pathname;

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
      }),
    }).catch(() => {});
  }, [pathname, session]);

  return null;
}
