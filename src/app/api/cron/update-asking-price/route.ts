import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isCronAuthorized } from "@/lib/cronAuth";
import { runForEachDistrict } from "@/lib/runUpdate";
import { askingPriceAdapter } from "@/lib/adapters/askingPrice";

export const dynamic = "force-dynamic";

// Manual-trigger-only refresh of 호가 snapshots (mock only — no real path in
// this build; see src/lib/adapters/askingPrice/realAskingPriceAdapter.ts).
// Not registered in vercel.json crons on purpose.
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = await runForEachDistrict("asking", async (district) => {
    const snapshots = await askingPriceAdapter.fetch(district);
    for (const snapshot of snapshots) {
      await prisma.askingPriceSnapshot.upsert({
        where: {
          districtId_propertyType_periodDate: {
            districtId: district.id,
            propertyType: snapshot.propertyType,
            periodDate: snapshot.periodDate,
          },
        },
        update: {
          avgAskingPricePerPyeong: snapshot.avgAskingPricePerPyeong,
          avgAskingPriceTotal: snapshot.avgAskingPriceTotal,
          listingCount: snapshot.listingCount,
          source: askingPriceAdapter.sourceName,
          raw: snapshot.raw === undefined ? undefined : (snapshot.raw as object),
        },
        create: {
          districtId: district.id,
          periodDate: snapshot.periodDate,
          avgAskingPricePerPyeong: snapshot.avgAskingPricePerPyeong,
          avgAskingPriceTotal: snapshot.avgAskingPriceTotal,
          listingCount: snapshot.listingCount,
          propertyType: snapshot.propertyType,
          source: askingPriceAdapter.sourceName,
          raw: snapshot.raw === undefined ? undefined : (snapshot.raw as object),
        },
      });
    }
  });

  return NextResponse.json({ asking: results });
}
