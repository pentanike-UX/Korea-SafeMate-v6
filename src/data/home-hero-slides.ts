/**
 * Home hero full-bleed carousel.
 * Display copy is localized via `Home.heroCarouselSlide*` keys in messages.
 */
export const HOME_HERO_SLIDES = [
  { src: "/images/hero/seoul1_BTS_Sungnyemun.avif", metaKey: "heroCarouselSlide1" as const },
  { src: "/images/hero/seoul2_MyLoveFromTheStar_NSeoulTower.jpg", metaKey: "heroCarouselSlide2" as const },
  { src: "/images/hero/seoul3_Dokebi_Gamgodang-gil.jpg", metaKey: "heroCarouselSlide3" as const },
  { src: "/images/hero/seoul4_aManWhoLivesWithAKing_Gyeongbokgung.jpg", metaKey: "heroCarouselSlide4" as const },
  { src: "/images/hero/seoul5_NSeoulTower.jpg", metaKey: "heroCarouselSlide5" as const },
  { src: "/images/hero/seoul6_BTS_Gwanghwamun.jpg", metaKey: "heroCarouselSlide6" as const },
] as const;

export type HomeHeroSlideMetaKey = (typeof HOME_HERO_SLIDES)[number]["metaKey"];

export const HOME_HERO_INTERVAL_MS = 5500;
