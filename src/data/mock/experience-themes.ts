export interface ExperienceTheme {
  slug: string;
  gradient: string;
}

/** Slugs align with Explore journey + guardian marketing `theme_slugs`. */
export const mockExperienceThemes: ExperienceTheme[] = [
  {
    slug: "k_drama_romance",
    gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)",
  },
  {
    slug: "seoul_night",
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #533483 100%)",
  },
  {
    slug: "k_pop_day",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    slug: "movie_location",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  },
  {
    slug: "safe_solo",
    gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  },
  {
    slug: "photo_route",
    gradient: "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
  },
];
