import { headers } from "next/headers";
import { getSessionSafe } from "@/lib/auth";
import prisma from "@/lib/prisma";
import MapClient from "./MapClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Łowiska | RybiaPaka",
  description: "Interaktywna mapa łowisk wędkarskich w Polsce.",
};

export default async function MapaLowiskPage() {
  const headersList = await headers();
  let session: { user?: { id?: number | string } } | null = null;
  try {
    session = await getSessionSafe(headersList);
  } catch {
    session = null;
  }

  const isLoggedIn =
    !!session?.user?.id && Number(session.user.id) > 0;

  const spots = await prisma.fishingSpot.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      addedBy: {
        select: { id: true, username: true, avatarUrl: true, image: true },
      },
    },
  });

  const serializedSpots = spots.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    lat: s.lat,
    lng: s.lng,
    type: s.type,
    createdAt: s.createdAt.toISOString(),
    addedBy: s.addedBy
      ? {
          id: s.addedBy.id,
          username: s.addedBy.username,
          avatarUrl: s.addedBy.avatarUrl ?? s.addedBy.image ?? null,
        }
      : null,
  }));

  return (
    <div
      className="w-full relative"
      style={{ height: "calc(100vh - 70px)" }}
    >
      <MapClient initialSpots={serializedSpots} isLoggedIn={isLoggedIn} />
    </div>
  );
}
