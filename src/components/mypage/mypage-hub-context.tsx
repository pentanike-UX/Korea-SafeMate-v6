"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { MypageHubContextValue } from "@/types/mypage-hub";

const MypageHubContext = createContext<MypageHubContextValue | null>(null);

export function MypageHubProvider({ value, children }: { value: MypageHubContextValue; children: ReactNode }) {
  return <MypageHubContext.Provider value={value}>{children}</MypageHubContext.Provider>;
}

export function useMypageHubContext(): MypageHubContextValue | null {
  return useContext(MypageHubContext);
}
