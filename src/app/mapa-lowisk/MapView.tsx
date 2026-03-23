"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import Map, { Marker } from "react-map-gl/maplibre";
import type { MockSpot, SpotType } from "./mockData";
import { TYPE_CONFIG } from "./mockData";

function SpotPin({ type, active }: { type: SpotType; active: boolean }) {
  const cfg = TYPE_CONFIG[type];
  const color = cfg.color;
  const size = active ? 36 : 28;
  const h = Math.round(size * 1.28);
  const filterId = `shadow-${type}-${active ? "a" : "i"}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 28 36"
      width={size}
      height={h}
      style={{ display: "block", cursor: "pointer" }}
    >
      <defs>
        <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor={color} floodOpacity="0.5" />
        </filter>
      </defs>
      {active && (
        <circle cx="14" cy="14" r="10" fill={color} opacity="0.35">
          <animate attributeName="r" from="8" to="16" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
      <path
        d="M14 0C6.3 0 0 6.3 0 14c0 8.4 14 22 14 22s14-13.6 14-22C28 6.3 21.7 0 14 0z"
        fill={color}
        filter={`url(#${filterId})`}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
      />
      <circle cx="14" cy="13" r="5" fill="white" opacity="0.9" />
    </svg>
  );
}

function PendingPin() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 28 36"
      width={32}
      height={41}
      style={{ display: "block" }}
    >
      <path
        d="M14 0C6.3 0 0 6.3 0 14c0 8.4 14 22 14 22s14-13.6 14-22C28 6.3 21.7 0 14 0z"
        fill="#ef4444"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1.5"
        strokeDasharray="3,2"
      />
      <circle cx="14" cy="13" r="5" fill="white" opacity="0.9" />
    </svg>
  );
}

type MapViewProps = {
  spots: MockSpot[];
  selectedId: string | null;
  onSelectSpot: (id: string) => void;
  addMode?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  pendingMarker?: { lat: number; lng: number } | null;
};

export default function MapView({
  spots,
  selectedId,
  onSelectSpot,
  addMode,
  onMapClick,
  pendingMarker,
}: MapViewProps) {
  return (
    <Map
      initialViewState={{ longitude: 19.4, latitude: 52.1, zoom: 6 }}
      minZoom={6}
      maxZoom={18}
      style={{ height: "100%", width: "100%" }}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
      cursor={addMode ? "crosshair" : undefined}
      onClick={(e) => {
        if (addMode) {
          onMapClick?.(e.lngLat.lat, e.lngLat.lng);
        }
      }}
    >
      {spots.map((spot) => {
        const isActive = spot.id === selectedId;
        return (
          <Marker
            key={spot.id}
            longitude={spot.lng}
            latitude={spot.lat}
            anchor="bottom"
            style={{ zIndex: isActive ? 10 : 1 }}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelectSpot(spot.id);
            }}
          >
            <SpotPin type={spot.type} active={isActive} />
          </Marker>
        );
      })}
      {pendingMarker && (
        <Marker
          longitude={pendingMarker.lng}
          latitude={pendingMarker.lat}
          anchor="bottom"
          style={{ zIndex: 20 }}
        >
          <PendingPin />
        </Marker>
      )}
    </Map>
  );
}
