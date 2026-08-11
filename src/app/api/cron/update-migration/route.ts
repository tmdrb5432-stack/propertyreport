import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isCronAuthorized } from "@/lib/cronAuth";
import { runForEachDistrict } from "@/lib/runUpdate";
import { migrationAdapter } from "@/lib/adapters/migration";

export const dynamic = "force-dynamic";

// Monthly refresh of 전입/전출 snapshots (mock until KOSIS key is configured).
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = await runForEachDistrict("migration", async (district) => {
    const snapshots = await migrationAdapter.fetch(district);
    for (const snapshot of snapshots) {
      await prisma.migrationSnapshot.upsert({
        where: {
          districtId_periodMonth: {
            districtId: district.id,
            periodMonth: snapshot.periodMonth,
          },
        },
        update: {
          inMigration: snapshot.inMigration,
          outMigration: snapshot.outMigration,
          netMigration: snapshot.netMigration,
          source: migrationAdapter.sourceName,
          raw: snapshot.raw === undefined ? undefined : (snapshot.raw as object),
        },
        create: {
          districtId: district.id,
          periodMonth: snapshot.periodMonth,
          inMigration: snapshot.inMigration,
          outMigration: snapshot.outMigration,
          netMigration: snapshot.netMigration,
          source: migrationAdapter.sourceName,
          raw: snapshot.raw === undefined ? undefined : (snapshot.raw as object),
        },
      });
    }
  });

  return NextResponse.json({ migration: results });
}
