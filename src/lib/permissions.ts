export type AdminRole = "editor" | "support" | "admin" | "super_admin";

export const ALL_ADMIN_ROLES: AdminRole[] = ["editor", "support", "admin", "super_admin"];

// What each role can access
const PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ["dashboard", "products", "orders", "customers", "coupons", "payments", "cms", "admins", "settings", "reviews", "analytics"],
  admin:       ["dashboard", "products", "orders", "customers", "coupons", "payments", "cms", "admins", "settings", "reviews", "analytics"],
  editor:      ["dashboard", "products", "cms"],
  support:     ["dashboard", "orders", "customers", "reviews"],
};

export function can(role: AdminRole | string | undefined, feature: string): boolean {
  if (!role) return false;
  return (PERMISSIONS[role as AdminRole] ?? []).includes(feature);
}

export function isAdminRole(role: unknown): role is AdminRole {
  return ALL_ADMIN_ROLES.includes(role as AdminRole);
}
