import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isCronAuthorized } from "@/lib/cronAuth";
import { runForEachDistrict } from "@/lib/runUpdate";
import { complexTransactionAdapter } from "@/lib/adapters/complexTransactions";
import { resolveComplexLocations } from "@/lib/kakao/geocodeComplex";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
// MOLIT's API (apis.data.go.kr) is a Korean government gateway that hangs
// from Vercel's default US region — see seed-dart-corpcodes for the same fix
// (requires Function Region = Seoul in Vercel project settings).
export const preferredRegion = "home";

// Daily refresh of per-apartment-complex 실거래가 snapshots (mock, or MOLIT
// real data once TRANSACTION source envs are set to "real"). Powers the
// district page's "단지별 실거래가 TOP 3" map + list.
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = await runForEachDistrict("complexTransaction", async (district) => {
    const snapshots = await complexTransactionAdapter.fetch(district);

    // Geocode+cache every complex name seen so the map can plot markers —
    // a no-op for names the real adapter already resolved while filtering
    // by radius, but required for the mock adapter's illustrative names.
    const uniqueNames = Array.from(new Set(snapshots.map((s) => s.complexName)));
    await resolveComplexLocations(
      district.id,
      uniqueNames,
      { lat: district.lat, lng: district.lng },
      district.radiusM,
    );

    // A district can have hundreds of (complex x month) rows — one upsert
    // per row was the same "thousands of round-trips" mistake fixed in
    // seed-dart-corpcodes, and was timing out here for the same reason.
    // This table has no incoming FK and is always regenerated fresh from
    // the adapter's current fetch, so a full per-district replace is safe.
    await prisma.$transaction([
      prisma.complexTransactionSnapshot.deleteMany({ where: { districtId: district.id } }),
      prisma.complexTransactionSnapshot.createMany({
        data: snapshots.map((snapshot) => ({
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
        })),
      }),
    ]);
  });

  return NextResponse.json({ complexTransaction: results });
}
