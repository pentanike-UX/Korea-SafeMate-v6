export type AppAccountRole = "traveler" | "guardian" | "admin" | "super_admin";

export const APP_ACCOUNT_ROLES: AppAccountRole[] = ["traveler", "guardian", "admin", "super_admin"];

export function isPrivilegedAppRole(role: AppAccountRole | null | undefined) {
  return role === "admin" || role === "super_admin";
}

/** Maps app plane → legacy `public.users.role` enum (DB). */
export function legacyUserRoleFromAppRole(app: AppAccountRole): string {
  switch (app) {
    case "super_admin":
      return "super_admin";
    case "admin":
      return "admin";
    case "guardian":
      return "active_guardian";
    default:
      return "traveler";
  }
}
