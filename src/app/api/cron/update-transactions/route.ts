import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isCronAuthorized } from "@/lib/cronAuth";
import { runForEachDistrict } from "@/lib/runUpdate";
import { transactionAdapter } from "@/lib/adapters/transactions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
// MOLIT's API (apis.data.go.kr) is a Korean government gateway that hangs
// from Vercel's default US region — see seed-dart-corpcodes for the same fix
// (requires Function Region = Seoul in Vercel project settings).
export const preferredRegion = "home";

// Daily refresh of 실거래가 snapshots (mock, or MOLIT real data once
// TRANSACTION_DATA_SOURCE=real is set).
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = await runForEachDistrict("transaction", async (district) => {
    const snapshots = await transactionAdapter.fetch(district);
    for (const snapshot of snapshots) {
      await prisma.transactionSnapshot.upsert({
        where: {
          districtId_propertyType_periodDate: {
            districtId: district.id,
            propertyType: snapshot.propertyType,
            periodDate: snapshot.periodDate,
          },
        },
        update: {
          avgPricePerPyeong: snapshot.avgPricePerPyeong,
          avgPriceTotal: snapshot.avgPriceTotal,
          medianPriceTotal: snapshot.medianPriceTotal,
          transactionCount: snapshot.transactionCount,
          source: transactionAdapter.sourceName,
          raw: snapshot.raw === undefined ? undefined : (snapshot.raw as object),
        },
        create: {
          districtId: district.id,
          periodDate: snapshot.periodDate,
          avgPricePerPyeong: snapshot.avgPricePerPyeong,
          avgPriceTotal: snapshot.avgPriceTotal,
          medianPriceTotal: snapshot.medianPriceTotal,
          transactionCount: snapshot.transactionCount,
          propertyType: snapshot.propertyType,
          source: transactionAdapter.sourceName,
          raw: snapshot.raw === undefined ? undefined : (snapshot.raw as object),
        },
      });
    }
  });

  return NextResponse.json({ transaction: results });
}
