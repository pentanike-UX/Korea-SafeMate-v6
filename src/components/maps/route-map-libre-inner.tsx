"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { RouteMapPreviewProps } from "@/components/maps/route-map-types";
import type { MapLatLng } from "@/types/domain";
import { boundsFromPoints } from "@/lib/maps/geo-project";
import { getMapStyleUrl } from "@/lib/maps/map-style";
import { cn } from "@/lib/utils";

const PATH_SOURCE = "route-path-src";
const PATH_LAYER = "route-path-line";

function lineLngLats(path: MapLatLng[], spots: RouteMapPreviewProps["spots"]): [number, number][] {
  if (path.length >= 2) return path.map((p) => [p.lng, p.lat]);
  return [...spots].sort((a, b) => a.order - b.order).map((s) => [s.lng, s.lat]);
}

function applyOverlay(map: maplibregl.Map, p: RouteMapPreviewProps) {
  const { spots, path, selectedSpotId, onSpotSelect, mapClickEnabled } = p;
  const markersRef = (map as unknown as { __routeMarkers?: maplibregl.Marker[] }).__routeMarkers ?? [];
  markersRef.forEach((mk) => mk.remove());
  const nextMarkers: maplibregl.Marker[] = [];
  (map as unknown as { __routeMarkers?: maplibregl.Marker[] }).__routeMarkers = nextMarkers;

  const coords = lineLngLats(path, spots);
  const hasLine = coords.length >= 2;
  const lineData: GeoJSON.Feature<GeoJSON.LineString> = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: hasLine ? coords : coords.length === 1 ? [coords[0], coords[0]] : [],
    },
  };

  if (!map.getSource(PATH_SOURCE)) {
    map.addSource(PATH_SOURCE, { type: "geojson", data: lineData });
    map.addLayer({
      id: PATH_LAYER,
      type: "line",
      source: PATH_SOURCE,
      layout: { "line-cap": "round", "line-join": "round", visibility: hasLine ? "visible" : "none" },
      paint: {
        "line-color": "hsl(220 65% 42%)",
        "line-width": 4,
        "line-opacity": 0.9,
      },
    });
  } else {
    (map.getSource(PATH_SOURCE) as maplibregl.GeoJSONSource).setData(lineData);
    if (map.getLayer(PATH_LAYER)) {
      map.setLayoutProperty(PATH_LAYER, "visibility", hasLine ? "visible" : "none");
    }
  }

  const sorted = [...spots].sort((a, b) => a.order - b.order);
  sorted.forEach((s) => {
    const selected = s.id === selectedSpotId;
    const el = document.createElement("button");
    el.type = "button";
    el.className = cn(
      "route-spot-pin flex size-8 cursor-pointer items-center justify-center rounded-full border-2 text-xs font-bold shadow-md transition-transform outline-none focus-visible:ring-2 focus-visible:ring-ring",
      selected
        ? "border-background z-10 scale-110 bg-[hsl(220_65%_42%)] text-white"
        : "border-foreground/25 bg-card text-foreground hover:scale-105",
    );
    el.textContent = String(s.order + 1);
    el.setAttribute("aria-label", `Stop ${s.order + 1}`);
    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      onSpotSelect?.(s.id);
    });
    nextMarkers.push(new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([s.lng, s.lat]).addTo(map));
  });

  const pointsForBounds: MapLatLng[] = path.length >= 2 ? path : spots.map((x) => ({ lat: x.lat, lng: x.lng }));
  if (pointsForBounds.length > 0) {
    const b = boundsFromPoints(pointsForBounds);
    map.fitBounds(
      [
        [b.minLng, b.minLat],
        [b.maxLng, b.maxLat],
      ],
      { padding: 52, maxZoom: 16, duration: 0 },
    );
  } else {
    map.jumpTo({ center: [126.978, 37.5665], zoom: 11 });
  }

  map.getCanvas().style.cursor = mapClickEnabled ? "crosshair" : "";
}

export function RouteMapLibreInner(props: RouteMapPreviewProps) {
  const { spots, path, selectedSpotId, onSpotSelect, onMapClick, className, mapClickEnabled } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new maplibregl.Map({
      container,
      style: getMapStyleUrl(),
      center: [126.978, 37.5665],
      zoom: 12,
      attributionControl: {},
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    const onMapClickHandler = (e: maplibregl.MapMouseEvent) => {
      const { mapClickEnabled: pick, onMapClick: cb } = propsRef.current;
      if (!pick || !cb) return;
      const t = e.originalEvent.target;
      if (t instanceof Element && t.closest(".route-spot-pin")) return;
      cb(e.lngLat.lat, e.lngLat.lng);
    };
    map.on("click", onMapClickHandler);

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(container);

    map.on("load", () => {
      applyOverlay(map, propsRef.current);
    });

    return () => {
      ro.disconnect();
      map.off("click", onMapClickHandler);
      const markers = (map as unknown as { __routeMarkers?: maplibregl.Marker[] }).__routeMarkers;
      markers?.forEach((mk) => mk.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    applyOverlay(map, { spots, path, selectedSpotId, onSpotSelect, onMapClick, className, mapClickEnabled });
  }, [spots, path, selectedSpotId, onSpotSelect, onMapClick, className, mapClickEnabled]);

  return <div ref={containerRef} className={cn("h-full min-h-[160px] w-full overflow-hidden [&_.maplibregl-ctrl]:m-2", className)} />;
}
