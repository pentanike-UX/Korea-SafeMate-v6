/** localStorage key for explicit light/dark choice. Absent = follow system. */
export const THEME_STORAGE_KEY = "42-guardians-color-mode";

export type ThemePreference = "light" | "dark";

export function readThemePreference(): ThemePreference | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeThemePreference(mode: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyThemeClass(mode: "light" | "dark") {
  document.documentElement.classList.toggle("dark", mode === "dark");
}
