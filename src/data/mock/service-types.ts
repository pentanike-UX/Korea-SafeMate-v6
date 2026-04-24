import type { ServiceType } from "@/types/domain";

export const mockServiceTypes: ServiceType[] = [
  {
    code: "arrival",
    name: "Arrival Companion",
    short_description:
      "From airport or station to your accommodation — transit basics and check-in support.",
    duration_hours: 3,
    base_price_krw: 120000,
  },
  {
    code: "k_route",
    name: "K-Route Companion",
    short_description:
      "Execution support for K-content related places you choose — not professional tour guiding.",
    duration_hours: 4,
    base_price_krw: 150000,
  },
  {
    code: "first_24h",
    name: "First 24 Hours",
    short_description:
      "First-day adaptation: transit, apps, food ordering, and settling in with realistic scope.",
    duration_hours: 5,
    base_price_krw: 180000,
  },
];
