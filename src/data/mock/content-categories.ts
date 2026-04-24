import type { ContentCategory } from "@/types/domain";

/** Explore category filters — slug is stable for DB `content_categories.slug`. */
export const mockContentCategories: ContentCategory[] = [
  {
    id: "cat-hot",
    slug: "hot-places",
    name: "Hot places",
    description: "Busy spots locals actually use — not only billboard attractions.",
  },
  {
    id: "cat-tip",
    slug: "local-tips",
    name: "Local tips",
    description: "Neighborhood rhythm, etiquette, and small friction savers.",
  },
  {
    id: "cat-food",
    slug: "food",
    name: "Food",
    description: "Queues, ordering mechanics, and specific picks with context.",
  },
  {
    id: "cat-shop",
    slug: "shopping",
    name: "Shopping",
    description: "Tax refund flow, album shops, and district-specific browsing tips.",
  },
  {
    id: "cat-k",
    slug: "k-content",
    name: "K-pop / drama / film spots",
    description: "Filming locations, pop-up culture, and realistic crowd behavior.",
  },
  {
    id: "cat-prac",
    slug: "practical",
    name: "Practical travel info",
    description: "Apps, payments, transit edge cases, and arrival mechanics.",
  },
];
