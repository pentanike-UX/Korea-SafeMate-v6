"use client";

import { HomeExploreProvider } from "@/components/home/home-explore-preferences";
import { HomeQuickStartExplorer } from "@/components/home/home-quick-start-explorer";
import { HomeRecommendedGuardiansSection } from "@/components/home/home-recommended-guardians";

export function HomeExploreBundle() {
  return (
    <HomeExploreProvider>
      <HomeQuickStartExplorer />
      <HomeRecommendedGuardiansSection />
    </HomeExploreProvider>
  );
}
