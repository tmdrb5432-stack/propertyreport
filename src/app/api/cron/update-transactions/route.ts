import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isCronAuthorized } from "@/lib/cronAuth";
import { runForEachDistrict } from "@/lib/runUpdate";
import { transactionAdapter } from "@/lib/adapters/transactions";

export const dynamic = "force-dynamic";

// Daily refresh of 실거래가 snapshots (mock until MOLIT key is configured).
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
