import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { resolveSessionUserId } from "@/app/api/forum/_utils";

export async function POST(req: NextRequest) {
  const userId = await resolveSessionUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const rawMethods: unknown[] = Array.isArray(body?.methods)
    ? body.methods
    : [];
  const methods = rawMethods
    .map((value) => String(value).trim().toLowerCase())
    .filter((value): value is string => value.length > 0);
  const uniqueMethods = Array.from(new Set(methods));

  try {
    const methodRows = uniqueMethods.length
      ? await prisma.fishingMethod.findMany({
          where: { name: { in: uniqueMethods } },
        })
      : [];
    const methodIds = methodRows.map((method) => method.id);

    const operations = [
      prisma.userFishingMethod.deleteMany({ where: { userId } }),
    ];
    if (methodIds.length > 0) {
      operations.push(
        prisma.userFishingMethod.createMany({
          data: methodIds.map((methodId) => ({ userId, methodId })),
        })
      );
    }
    await prisma.$transaction(operations);

    return NextResponse.json({
      success: true,
      methods: methodRows.map((method) => method.name),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to update user methods", error);
    return NextResponse.json({ error: "FAILED_TO_UPDATE" }, { status: 500 });
  }
}
