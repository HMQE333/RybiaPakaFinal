"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import { useEffect, useRef } from "react";

export type FishingSpot = {
  id: string;
  name: string;
  description: string | null;
  lat: number;
  lng: number;
  type: string | null;
  createdAt: string;
  addedBy: {
    id: number;
    username: string | null;
    avatarUrl: string | null;
  } | null;
};

const TYPE_COLORS: Record<string, string> = {
  rzeka: "#3b82f6",
  jezioro: "#06b6d4",
  zbiornik: "#8b5cf6",
  morze: "#0ea5e9",
  staw: "#22c55e",
  inne: "#f59e0b",
};

const TYPE_LABELS: Record<string, string> = {
  rzeka: "Rzeka",
  jezioro: "Jezioro",
  zbiornik: "Zbiornik",
  morze: "Morze",
  staw: "Staw",
  inne: "Inne",
};

function makeIcon(type: string | null) {
  const color = TYPE_COLORS[type ?? "inne"] ?? TYPE_COLORS.inne;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20s12-12.8 12-20C24 5.4 18.6 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -34],
  });
}

function ClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type MapViewProps = {
  spots: FishingSpot[];
  onMapClick?: (lat: number, lng: number) => void;
  pendingMarker?: { lat: number; lng: number } | null;
};

export default function MapView({
  spots,
  onMapClick,
  pendingMarker,
}: MapViewProps) {
  const pendingIcon = useRef(
    L.divIcon({
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20s12-12.8 12-20C24 5.4 18.6 0 12 0z" fill="#ef4444" stroke="white" stroke-width="1.5" stroke-dasharray="2,1"/>
        <circle cx="12" cy="12" r="5" fill="white"/>
      </svg>`,
      className: "",
      iconSize: [24, 32],
      iconAnchor: [12, 32],
    })
  );

  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  return (
    <MapContainer
      center={[52.1, 19.4]}
      zoom={6}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {onMapClick && <ClickHandler onMapClick={onMapClick} />}
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lng]}
          icon={makeIcon(spot.type)}
        >
          <Popup>
            <div className="min-w-[160px]">
              <p className="font-semibold text-sm mb-0.5">{spot.name}</p>
              {spot.type && (
                <p className="text-xs text-gray-500 mb-1">
                  {TYPE_LABELS[spot.type] ?? spot.type}
                </p>
              )}
              {spot.description && (
                <p className="text-xs text-gray-700 mb-1">{spot.description}</p>
              )}
              {spot.addedBy?.username && (
                <p className="text-[10px] text-gray-400">
                  Dodał: @{spot.addedBy.username}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
      {pendingMarker && (
        <Marker
          position={[pendingMarker.lat, pendingMarker.lng]}
          icon={pendingIcon.current}
        />
      )}
    </MapContainer>
  );
}
