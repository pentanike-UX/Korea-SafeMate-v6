import type { Region } from "@/types/domain";

export const mockRegions: Region[] = [
  {
    id: "r-seoul",
    slug: "seoul",
    name: "Seoul Capital Area",
    name_ko: "수도권",
    phase: 1,
    short_description: "Phase 1 · dense transit, arrivals, K-culture hubs.",
    detail_blurb:
      "From ICN/Gimpo arrivals to Hongdae, Gangnam, and palaces — Seoul is where most first-timer friction shows up. Explore focuses on payment edge cases, late-night safety-of-flow, and K-content spots you can actually execute without a packaged tour script.",
  },
  {
    id: "r-busan",
    slug: "busan",
    name: "Busan & vicinity",
    name_ko: "부산",
    phase: 1,
    short_description: "Phase 1 · coast, markets, practical coastal city tips.",
    detail_blurb:
      "Markets, beaches, and summer transit quirks. Intel here is written for humidity, weekend crawl, and getting fed without hour-long queues at the obvious gates.",
  },
  {
    id: "r-jeju",
    slug: "jeju",
    name: "Jeju",
    name_ko: "제주",
    phase: 2,
    short_description: "Phase 2 · island logistics, weather, rental quirks.",
    detail_blurb:
      "Rental cars, wind, and café strips that look closer on the map than they feel in traffic. Phase 2 region — fewer posts today, growing with Guardian contributions.",
  },
];
