"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useEffect } from "react";
import type { MockSpot, SpotType } from "./mockData";
import { TYPE_CONFIG } from "./mockData";

function makeMarkerIcon(type: SpotType, active: boolean) {
  const cfg = TYPE_CONFIG[type];
  const color = cfg.color;
  const size = active ? 36 : 28;
  const pulse = active
    ? `<circle cx="14" cy="14" r="13" fill="${color}" opacity="0.2" class="pulse-ring"/>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 36" width="${size}" height="${size * 1.28}">
    ${pulse}
    <filter id="shadow-${type}" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="${color}" flood-opacity="0.5"/>
    </filter>
    <path d="M14 0C6.3 0 0 6.3 0 14c0 8.4 14 22 14 22s14-13.6 14-22C28 6.3 21.7 0 14 0z" 
      fill="${color}" filter="url(#shadow-${type})" 
      stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
    <circle cx="14" cy="13" r="5" fill="white" opacity="0.9"/>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, Math.round(size * 1.28)],
    iconAnchor: [size / 2, Math.round(size * 1.28)],
    popupAnchor: [0, -Math.round(size * 1.28) - 4],
  });
}

function ClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
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
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const pendingIcon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 36" width="32" height="41">
      <path d="M14 0C6.3 0 0 6.3 0 14c0 8.4 14 22 14 22s14-13.6 14-22C28 6.3 21.7 0 14 0z" 
        fill="#ef4444" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-dasharray="3,2"/>
      <circle cx="14" cy="13" r="5" fill="white" opacity="0.9"/>
    </svg>`,
    className: "",
    iconSize: [32, 41],
    iconAnchor: [16, 41],
  });

  return (
    <MapContainer
      center={[52.1, 19.4]}
      zoom={6}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />
      {addMode && <ClickHandler onMapClick={onMapClick} />}
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lng]}
          icon={makeMarkerIcon(spot.type, spot.id === selectedId)}
          eventHandlers={{ click: () => onSelectSpot(spot.id) }}
          zIndexOffset={spot.id === selectedId ? 1000 : 0}
        />
      ))}
      {pendingMarker && (
        <Marker position={[pendingMarker.lat, pendingMarker.lng]} icon={pendingIcon} />
      )}
    </MapContainer>
  );
}
