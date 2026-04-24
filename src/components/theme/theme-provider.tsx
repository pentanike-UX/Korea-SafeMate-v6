"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  applyThemeClass,
  readThemePreference,
  systemPrefersDark,
  writeThemePreference,
  type ThemePreference,
} from "@/lib/theme-storage";

type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  /** Effective theme after system / storage resolution */
  resolved: ResolvedTheme;
  /** null = following system */
  stored: ThemePreference | null;
  mounted: boolean;
  setTheme: (mode: ResolvedTheme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [stored, setStored] = useState<ThemePreference | null>(null);
  const [mounted, setMounted] = useState(false);

  const resolved: ResolvedTheme = stored ?? (systemPrefersDark() ? "dark" : "light");

  useLayoutEffect(() => {
    setStored(readThemePreference());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const r = stored ?? (systemPrefersDark() ? "dark" : "light");
    applyThemeClass(r);
  }, [mounted, stored]);

  useEffect(() => {
    if (!mounted || stored !== null) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      applyThemeClass(mq.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mounted, stored]);

  const setTheme = useCallback((mode: ResolvedTheme) => {
    writeThemePreference(mode);
    setStored(mode);
    applyThemeClass(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: ResolvedTheme = resolved === "dark" ? "light" : "dark";
    setTheme(next);
  }, [resolved, setTheme]);

  const value = useMemo(
    () => ({ resolved, stored, mounted, setTheme, toggleTheme }),
    [resolved, stored, mounted, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
