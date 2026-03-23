"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useEffect } from "react";

const SPOTS = [
  { id: "1", lat: 52.23, lng: 21.01, label: "Jezioro Zegrzyńskie" },
  { id: "2", lat: 54.18, lng: 22.15, label: "Jez. Hańcza" },
  { id: "3", lat: 53.79, lng: 20.49, label: "Jez. Łańskie" },
  { id: "4", lat: 52.42, lng: 16.93, label: "Jez. Maltańskie" },
  { id: "5", lat: 49.98, lng: 20.05, label: "Wisła – Kraków" },
];

export function LeafletESRI() {
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const spotIcon = (active = false) => {
    const color = "#00ce00";
    const size = active ? 36 : 28;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 36" width="${size}" height="${Math.round(size * 1.28)}">
      <filter id="sh" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="${color}" flood-opacity="0.5"/>
      </filter>
      <path d="M14 0C6.3 0 0 6.3 0 14c0 8.4 14 22 14 22s14-13.6 14-22C28 6.3 21.7 0 14 0z"
        fill="${color}" filter="url(#sh)" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
      <circle cx="14" cy="13" r="5" fill="white" opacity="0.9"/>
    </svg>`;
    return L.divIcon({
      html: svg,
      className: "",
      iconSize: [size, Math.round(size * 1.28)],
      iconAnchor: [size / 2, Math.round(size * 1.28)],
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#141414" }}>
      <div style={{ padding: "10px 16px", background: "#0e0e0e", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#00ce00", fontWeight: 700, fontSize: 14, fontFamily: "sans-serif" }}>Wariant A</span>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "sans-serif" }}>Leaflet + ESRI World Topo (rastrowe kafelki, bez klucza API)</span>
      </div>
      <div style={{ flex: 1 }}>
        <MapContainer
          center={[52.1, 19.4]}
          zoom={6}
          minZoom={6}
          maxZoom={18}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri — Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (HK), and the GIS User Community"
            maxZoom={18}
          />
          {SPOTS.map((s) => (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={spotIcon()} />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
