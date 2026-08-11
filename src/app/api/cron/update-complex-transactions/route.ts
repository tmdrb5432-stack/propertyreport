import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isCronAuthorized } from "@/lib/cronAuth";
import { runForEachDistrict } from "@/lib/runUpdate";
import { complexTransactionAdapter } from "@/lib/adapters/complexTransactions";

export const dynamic = "force-dynamic";

// Daily refresh of per-apartment-complex 실거래가 snapshots (mock until MOLIT
// key is configured). Powers the district page's "단지별 실거래가 TOP 3" card.
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = await runForEachDistrict("complexTransaction", async (district) => {
    const snapshots = await complexTransactionAdapter.fetch(district);
    for (const snapshot of snapshots) {
      await prisma.complexTransactionSnapshot.upsert({
        where: {
          districtId_complexName_propertyType_periodDate: {
            districtId: district.id,
            complexName: snapshot.complexName,
            propertyType: snapshot.propertyType,
            periodDate: snapshot.periodDate,
          },
        },
        update: {
          avgPricePerPyeong: snapshot.avgPricePerPyeong,
          avgPriceTotal: snapshot.avgPriceTotal,
          medianPriceTotal: snapshot.medianPriceTotal,
          transactionCount: snapshot.transactionCount,
          source: complexTransactionAdapter.sourceName,
          raw: snapshot.raw === undefined ? undefined : (snapshot.raw as object),
        },
        create: {
          districtId: district.id,
          periodDate: snapshot.periodDate,
          complexName: snapshot.complexName,
          avgPricePerPyeong: snapshot.avgPricePerPyeong,
          avgPriceTotal: snapshot.avgPriceTotal,
          medianPriceTotal: snapshot.medianPriceTotal,
          transactionCount: snapshot.transactionCount,
          propertyType: snapshot.propertyType,
          source: complexTransactionAdapter.sourceName,
          raw: snapshot.raw === undefined ? undefined : (snapshot.raw as object),
        },
      });
    }
  });

  return NextResponse.json({ complexTransaction: results });
}
