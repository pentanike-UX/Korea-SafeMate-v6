"use client";

import dynamic from "next/dynamic";
import { RouteMapSchematic } from "@/components/maps/route-map-schematic";
import type { RouteMapPreviewProps } from "@/components/maps/route-map-types";

export type { RouteMapPreviewProps };

const RouteMapLibreDynamic = dynamic(
  () => import("@/components/maps/route-map-libre-inner").then((mod) => ({ default: mod.RouteMapLibreInner })),
  {
    ssr: false,
    loading: () => <div className="bg-muted/50 h-full min-h-[120px] w-full animate-pulse rounded-md" aria-hidden />,
  },
);

/**
 * Interactive route map: **MapLibre GL** + OSM-based tiles (default: OpenFreeMap, no API key).
 * Set `NEXT_PUBLIC_MAP_PROVIDER=schematic` for SVG fallback (CI / no WebGL).
 * Set `NEXT_PUBLIC_MAP_STYLE_URL` for MapTiler, Mapbox, or other MapLibre-compatible styles.
 */
export function RouteMapPreview(props: RouteMapPreviewProps) {
  if (process.env.NEXT_PUBLIC_MAP_PROVIDER === "schematic") {
    return <RouteMapSchematic {...props} />;
  }
  return <RouteMapLibreDynamic {...props} />;
}
