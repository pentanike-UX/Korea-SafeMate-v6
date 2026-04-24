import type { LaunchAreaSlug } from "@/types/launch-area";

export type { LaunchAreaSlug };

export interface LaunchAreaCard {
  slug: LaunchAreaSlug;
  /** Public path — `public/images/regions/{slug}.png` */
  imageUrl: string;
  active: boolean;
  comingSoon?: boolean;
}

/** File names match slug: `public/images/regions/{slug}.png` */
export const mockLaunchAreas: LaunchAreaCard[] = [
  {
    slug: "gwanghwamun",
    active: true,
    imageUrl: "/images/regions/gwanghwamun.png",
  },
  {
    slug: "gangnam",
    active: true,
    imageUrl: "/images/regions/gangnam.png",
  },
  {
    slug: "busan",
    active: false,
    comingSoon: true,
    imageUrl: "/images/regions/busan.png",
  },
  {
    slug: "jeju",
    active: false,
    comingSoon: true,
    imageUrl: "/images/regions/jeju.png",
  },
];
