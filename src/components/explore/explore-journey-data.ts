/** Curated picks for taste builder search (prototype). */
export const EXPLORE_WORK_SUGGESTIONS: Record<string, string[]> = {
  ko: [
    "도깨비",
    "이태원 클라쓰",
    "기생충",
    "오징어 게임",
    "더 글로리",
    "사랑의 불시착",
    "미스터 션샤인",
    "킹덤",
  ],
  en: [
    "Goblin",
    "Itaewon Class",
    "Parasite",
    "Squid Game",
    "The Glory",
    "Crash Landing on You",
    "Mr. Sunshine",
    "Kingdom",
  ],
  ja: [
    "トッケビ",
    "イテウォンクラス",
    "パラサイト",
    "イカゲーム",
    "ザ・グローリー",
    "愛の不時着",
    "Mr.サンシャイン",
    "キングダム",
  ],
};

export const EXPLORE_ARTIST_SUGGESTIONS: Record<string, string[]> = {
  ko: ["아이유", "BTS", "블랙핑크", "뉴진스", "이병헌", "공유", "손예진", "박서준"],
  en: ["IU", "BTS", "BLACKPINK", "NewJeans", "Lee Byung-hun", "Gong Yoo", "Son Ye-jin", "Park Seo-joon"],
  ja: ["IU", "BTS", "BLACKPINK", "NewJeans", "イ・ビョンホン", "コンユ", "ソン・イェジン", "パク・ソジュン"],
};

export type TripWhenPreset = "weekend" | "next_week" | "two_weeks" | "flex";

export type PartySize = "solo" | "two" | "small" | "group";

export const SCENE_MOOD_IDS = ["scene_neon", "scene_hanok", "scene_cafe", "scene_photo", "scene_quiet", "scene_romantic"] as const;
export type SceneMoodId = (typeof SCENE_MOOD_IDS)[number];

export const GUARDIAN_STYLE_IDS = [
  "style_calm",
  "style_planner",
  "style_energetic",
  "style_trendy",
  "style_flexible",
  "style_no_match_test",
] as const;
export type GuardianStyleId = (typeof GUARDIAN_STYLE_IDS)[number];

export function companionSlugsForStyle(id: GuardianStyleId): string[] {
  switch (id) {
    case "style_calm":
      return ["calm", "friendly"];
    case "style_planner":
      return ["planner"];
    case "style_energetic":
      return ["energetic"];
    case "style_trendy":
      return ["trendy"];
    case "style_flexible":
      return ["flexible"];
    case "style_no_match_test":
      // Intentionally unmatched option for empty-result UX testing.
      return ["__no_guardian_match__"];
    default:
      return [];
  }
}

export function sceneMoodToTasteIds(id: SceneMoodId): string[] {
  switch (id) {
    case "scene_photo":
    case "scene_neon":
    case "scene_hanok":
      return ["tastePhoto"];
    case "scene_cafe":
      return ["tasteFood"];
    case "scene_quiet":
    case "scene_romantic":
      return ["tasteSolo", "tastePhoto"];
    default:
      return [];
  }
}
