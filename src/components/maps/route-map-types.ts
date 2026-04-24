import type { MapLatLng, RouteSpot } from "@/types/domain";

export type RouteMapPreviewProps = {
  spots: RouteSpot[];
  path: MapLatLng[];
  selectedSpotId?: string | null;
  onSpotSelect?: (id: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  mapClickEnabled?: boolean;
};
