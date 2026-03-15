import { NextResponse } from "next/server";

import { listInfoEntries } from "@/lib/informacjeStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await listInfoEntries();
  return NextResponse.json({ entries });
}
