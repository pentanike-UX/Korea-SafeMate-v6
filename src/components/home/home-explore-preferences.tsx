"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { LaunchAreaSlug } from "@/types/launch-area";

export type HomeQuickStartTheme = string | null;

type HomeExplorePreferencesValue = {
  area: LaunchAreaSlug | null;
  theme: HomeQuickStartTheme;
  setArea: (v: LaunchAreaSlug | null) => void;
  setTheme: (v: HomeQuickStartTheme) => void;
};

const HomeExplorePreferencesContext = createContext<HomeExplorePreferencesValue | null>(null);

export function HomeExploreProvider({ children }: { children: ReactNode }) {
  const [area, setArea] = useState<LaunchAreaSlug | null>(null);
  const [theme, setTheme] = useState<HomeQuickStartTheme>(null);
  const value = useMemo(() => ({ area, theme, setArea, setTheme }), [area, theme]);
  return <HomeExplorePreferencesContext.Provider value={value}>{children}</HomeExplorePreferencesContext.Provider>;
}

export function useHomeExplorePreferences(): HomeExplorePreferencesValue {
  const ctx = useContext(HomeExplorePreferencesContext);
  if (!ctx) {
    throw new Error("useHomeExplorePreferences must be used within HomeExploreProvider");
  }
  return ctx;
}
