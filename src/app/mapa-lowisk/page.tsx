import MapClient from "./MapClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Łowiska | RybiaPaka",
  description: "Interaktywna mapa łowisk wędkarskich w Polsce — opinie, wskazówki i gatunki ryb.",
};

export default function MapaLowiskPage() {
  return (
    <div
      className="w-full relative"
      style={{ height: "calc(100vh - 70px)" }}
    >
      <MapClient />
    </div>
  );
}
