import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isCronAuthorized } from "@/lib/cronAuth";
import { DISTRICTS } from "@/lib/districts";

export const dynamic = "force-dynamic";

// One-time/idempotent seed of the 5 fixed districts. Safe to call repeatedly
// (upsert) — other cron routes write snapshots keyed to District.id via a
// foreign key, so this must run once against any fresh database before them.
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = [];
  for (const d of DISTRICTS) {
    await prisma.district.upsert({
      where: { id: d.id },
      update: {
        nameKo: d.nameKo,
        nameEn: d.nameEn,
        lat: d.lat,
        lng: d.lng,
        radiusM: d.radiusM,
      },
      create: {
        id: d.id,
        nameKo: d.nameKo,
        nameEn: d.nameEn,
        lat: d.lat,
        lng: d.lng,
        radiusM: d.radiusM,
      },
    });
    results.push(d.id);
  }

  return NextResponse.json({ seeded: results });
}
