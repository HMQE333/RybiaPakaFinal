import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { resolveSessionUserId } from "@/app/api/forum/_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const spots = await prisma.fishingSpot.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      addedBy: {
        select: { id: true, username: true, avatarUrl: true, image: true },
      },
    },
  });

  return NextResponse.json(
    {
      spots: spots.map((s) => ({
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
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

const SPOT_TYPES = [
  "rzeka",
  "jezioro",
  "zbiornik",
  "morze",
  "staw",
  "inne",
] as const;

export async function POST(req: NextRequest) {
  const userId = await resolveSessionUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: {
    name?: unknown;
    description?: unknown;
    lat?: unknown;
    lng?: unknown;
    type?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : null;
  const lat = typeof body.lat === "number" ? body.lat : null;
  const lng = typeof body.lng === "number" ? body.lng : null;
  const type =
    typeof body.type === "string" && SPOT_TYPES.includes(body.type as never)
      ? body.type
      : "inne";

  if (!name || name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: "INVALID_NAME" }, { status: 400 });
  }
  if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "INVALID_COORDS" }, { status: 400 });
  }
  if (lat < 49 || lat > 55 || lng < 14 || lng > 25) {
    return NextResponse.json(
      { error: "COORDS_OUT_OF_POLAND" },
      { status: 400 }
    );
  }

  const spot = await prisma.fishingSpot.create({
    data: {
      name,
      description: description || null,
      lat,
      lng,
      type,
      addedById: userId,
    },
    include: {
      addedBy: {
        select: { id: true, username: true, avatarUrl: true, image: true },
      },
    },
  });

  return NextResponse.json(
    {
      spot: {
        id: spot.id,
        name: spot.name,
        description: spot.description,
        lat: spot.lat,
        lng: spot.lng,
        type: spot.type,
        createdAt: spot.createdAt.toISOString(),
        addedBy: spot.addedBy
          ? {
              id: spot.addedBy.id,
              username: spot.addedBy.username,
              avatarUrl:
                spot.addedBy.avatarUrl ?? spot.addedBy.image ?? null,
            }
          : null,
      },
    },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}
