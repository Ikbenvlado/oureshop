"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const ADMIN_ROLES = ["admin", "super_admin", "editor", "support"];

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (pathname === lastTracked.current) return;
    if (pathname.startsWith("/admin")) return;

    // Skip tracking for admin users
    const role = (session?.user as any)?.role;
    if (ADMIN_ROLES.includes(role)) return;

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
