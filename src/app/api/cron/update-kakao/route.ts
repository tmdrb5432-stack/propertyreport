import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isCronAuthorized } from "@/lib/cronAuth";
import { runForEachDistrict } from "@/lib/runUpdate";
import { kakaoCompanyAdapter } from "@/lib/adapters/kakao/companyAdapter";
import { kakaoTransitAdapter } from "@/lib/adapters/kakao/transitAdapter";

export const dynamic = "force-dynamic";

// Daily refresh of Kakao-backed company + transit data for all 5 districts.
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const companyResults = await runForEachDistrict("company", async (district) => {
    const result = await kakaoCompanyAdapter.fetch(district);
    await prisma.companySnapshot.create({
      data: {
        districtId: district.id,
        companyCount: result.companyCount,
        employeeCount: result.employeeCount,
        notableCompanies: result.notableCompanies as unknown as object,
        source: kakaoCompanyAdapter.sourceName,
        raw: result.raw === undefined ? undefined : (result.raw as object),
      },
    });
  });

  const transitResults = await runForEachDistrict("transit", async (district) => {
    const result = await kakaoTransitAdapter.fetch(district);
    await prisma.transitSnapshot.create({
      data: {
        districtId: district.id,
        subwayLines: result.subwayLines,
        subwayStationCount: result.subwayStationCount,
        busStopCount: result.busStopCount,
        transitScore: result.transitScore,
        source: kakaoTransitAdapter.sourceName,
        raw: result.raw === undefined ? undefined : (result.raw as object),
      },
    });
  });

  return NextResponse.json({ company: companyResults, transit: transitResults });
}
