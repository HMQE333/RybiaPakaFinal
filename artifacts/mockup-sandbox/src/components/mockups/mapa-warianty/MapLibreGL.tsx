import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

const SPOTS = [
  { id: "1", lat: 52.23, lng: 21.01, label: "Jezioro Zegrzyńskie" },
  { id: "2", lat: 54.18, lng: 22.15, label: "Jez. Hańcza" },
  { id: "3", lat: 53.79, lng: 20.49, label: "Jez. Łańskie" },
  { id: "4", lat: 52.42, lng: 16.93, label: "Jez. Maltańskie" },
  { id: "5", lat: 49.98, lng: 20.05, label: "Wisła – Kraków" },
];

function PinIcon() {
  const color = "#00ce00";
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 36" width="28" height="36" style={{ filter: `drop-shadow(0 2px 4px ${color}99)` }}>
      <path
        d="M14 0C6.3 0 0 6.3 0 14c0 8.4 14 22 14 22s14-13.6 14-22C28 6.3 21.7 0 14 0z"
        fill={color}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
      />
      <circle cx="14" cy="13" r="5" fill="white" opacity="0.9" />
    </svg>
  );
}

export function MapLibreGL() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#141414" }}>
      <div style={{ padding: "10px 16px", background: "#0e0e0e", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#00ce00", fontWeight: 700, fontSize: 14, fontFamily: "sans-serif" }}>Wariant B</span>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "sans-serif" }}>MapLibre GL JS — wektorowe kafelki (płynny zoom, nowoczesna biblioteka)</span>
      </div>
      <div style={{ flex: 1 }}>
        <Map
          initialViewState={{ longitude: 19.4, latitude: 52.1, zoom: 5.5 }}
          minZoom={5}
          maxZoom={18}
          style={{ width: "100%", height: "100%" }}
          mapStyle="https://tiles.openfreemap.org/styles/liberty"
        >
          <NavigationControl position="top-right" />
          {SPOTS.map((s) => (
            <Marker key={s.id} longitude={s.lng} latitude={s.lat} anchor="bottom">
              <PinIcon />
            </Marker>
          ))}
        </Map>
      </div>
    </div>
  );
}
