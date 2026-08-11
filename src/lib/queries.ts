import { prisma } from "@/lib/db";
import { DISTRICTS } from "@/lib/districts";
import { computeJobHousingIndex } from "@/lib/scoring/jobHousingIndex";
import { computeMobilityIndex } from "@/lib/scoring/mobilityIndex";
import { getDistrictFreshness, type FreshnessInfo } from "@/lib/freshness";
import type { NotableCompany } from "@/lib/adapters/types";

export interface DistrictOverview {
  id: string;
  nameKo: string;
  nameEn: string;
  lat: number;
  lng: number;
  companyCount: number | null;
  employeeCount: number | null;
  transitScore: number | null;
  subwayLines: string[];
  latestPricePerPyeong: number | null;
  priceTrend: { periodDate: Date; avgPricePerPyeong: number | null }[];
  jobHousingIndex: number;
  mobilityIndex: number;
  freshness: FreshnessInfo[];
}

function priceGrowthRatio(
  trend: { avgPricePerPyeong: number | null }[],
): number | null {
  if (trend.length < 2) return null;
  const first = trend[0].avgPricePerPyeong;
  const last = trend[trend.length - 1].avgPricePerPyeong;
  if (!first || !last) return null;
  return (last - first) / first;
}

export async function getOverviewData(): Promise<DistrictOverview[]> {
  const rows = await Promise.all(
    DISTRICTS.map(async (district) => {
      const [company, transit, priceTrend, freshness] = await Promise.all([
        prisma.companySnapshot.findFirst({
          where: { districtId: district.id },
          orderBy: { capturedAt: "desc" },
        }),
        prisma.transitSnapshot.findFirst({
          where: { districtId: district.id },
          orderBy: { capturedAt: "desc" },
        }),
        prisma.transactionSnapshot.findMany({
          where: { districtId: district.id },
          orderBy: { periodDate: "asc" },
          select: { periodDate: true, avgPricePerPyeong: true },
        }),
        getDistrictFreshness(district.id),
      ]);

      return {
        id: district.id,
        nameKo: district.nameKo,
        nameEn: district.nameEn,
        lat: district.lat,
        lng: district.lng,
        companyCount: company?.companyCount ?? null,
        employeeCount: company?.employeeCount ?? null,
        transitScore: transit?.transitScore ?? null,
        subwayLines: (transit?.subwayLines as string[] | undefined) ?? [],
        latestPricePerPyeong:
          priceTrend.length > 0
            ? priceTrend[priceTrend.length - 1].avgPricePerPyeong
            : null,
        priceTrend,
        growthRatio: priceGrowthRatio(priceTrend),
        freshness,
      };
    }),
  );

  const jobHousingScores = computeJobHousingIndex(
    rows.map((r) => ({
      districtId: r.id,
      companyCount: r.companyCount ?? 0,
      employeeCount: r.employeeCount,
      priceGrowthRatio: r.growthRatio,
    })),
  );

  const mobilityScores = computeMobilityIndex(
    rows.map((r) => ({ districtId: r.id, transitScore: r.transitScore ?? 0 })),
  );

  return rows.map((r) => ({
    id: r.id,
    nameKo: r.nameKo,
    nameEn: r.nameEn,
    lat: r.lat,
    lng: r.lng,
    companyCount: r.companyCount,
    employeeCount: r.employeeCount,
    transitScore: r.transitScore,
    subwayLines: r.subwayLines,
    latestPricePerPyeong: r.latestPricePerPyeong,
    priceTrend: r.priceTrend,
    freshness: r.freshness,
    jobHousingIndex: jobHousingScores[r.id] ?? 0,
    mobilityIndex: mobilityScores[r.id] ?? 0,
  }));
}

export interface DistrictDetail {
  id: string;
  nameKo: string;
  nameEn: string;
  lat: number;
  lng: number;
  companyCount: number | null;
  employeeCount: number | null;
  notableCompanies: NotableCompany[];
  transitScore: number | null;
  subwayLines: string[];
  subwayStationCount: number | null;
  busStopCount: number | null;
  transactions: {
    periodDate: Date;
    avgPricePerPyeong: number | null;
    transactionCount: number;
  }[];
  askingPrices: {
    periodDate: Date;
    avgAskingPricePerPyeong: number | null;
    listingCount: number;
  }[];
  migrations: {
    periodMonth: string;
    inMigration: number;
    outMigration: number;
    netMigration: number;
  }[];
  freshness: FreshnessInfo[];
}

export async function getDistrictDetail(
  districtId: string,
): Promise<DistrictDetail | null> {
  const district = await prisma.district.findUnique({ where: { id: districtId } });
  if (!district) return null;

  const [company, transit, transactions, askingPrices, migrations, freshness] =
    await Promise.all([
      prisma.companySnapshot.findFirst({
        where: { districtId },
        orderBy: { capturedAt: "desc" },
      }),
      prisma.transitSnapshot.findFirst({
        where: { districtId },
        orderBy: { capturedAt: "desc" },
      }),
      prisma.transactionSnapshot.findMany({
        where: { districtId },
        orderBy: { periodDate: "asc" },
        select: { periodDate: true, avgPricePerPyeong: true, transactionCount: true },
      }),
      prisma.askingPriceSnapshot.findMany({
        where: { districtId },
        orderBy: { periodDate: "asc" },
        select: {
          periodDate: true,
          avgAskingPricePerPyeong: true,
          listingCount: true,
        },
      }),
      prisma.migrationSnapshot.findMany({
        where: { districtId },
        orderBy: { periodMonth: "asc" },
        select: { periodMonth: true, inMigration: true, outMigration: true, netMigration: true },
      }),
      getDistrictFreshness(districtId),
    ]);

  return {
    id: district.id,
    nameKo: district.nameKo,
    nameEn: district.nameEn,
    lat: district.lat,
    lng: district.lng,
    companyCount: company?.companyCount ?? null,
    employeeCount: company?.employeeCount ?? null,
    notableCompanies:
      (company?.notableCompanies as NotableCompany[] | undefined) ?? [],
    transitScore: transit?.transitScore ?? null,
    subwayLines: (transit?.subwayLines as string[] | undefined) ?? [],
    subwayStationCount: transit?.subwayStationCount ?? null,
    busStopCount: transit?.busStopCount ?? null,
    transactions,
    askingPrices,
    migrations,
    freshness,
  };
}

export interface ComplexTransactionPoint {
  periodDate: Date;
  avgPricePerPyeong: number | null;
  transactionCount: number;
}

export interface TopComplex {
  complexName: string;
  latestPeriodDate: Date;
  latestAvgPricePerPyeong: number | null;
  latestAvgPriceTotal: number | null;
  latestTransactionCount: number;
  trend: ComplexTransactionPoint[];
}

/**
 * Top N apartment complexes in a district by latest 실거래가 (평당가), each
 * with its recent trend for a mini chart. Prisma has no native "latest row
 * per group, then order by that value" query, so this fetches the full
 * per-complex history (bounded — a handful of complexes x 6 months per
 * district) and does the latest-per-complex + ranking in JS.
 */
export async function getTopComplexesForDistrict(
  districtId: string,
  limit = 3,
): Promise<TopComplex[]> {
  const rows = await prisma.complexTransactionSnapshot.findMany({
    where: { districtId, propertyType: "아파트" },
    orderBy: { periodDate: "asc" },
    select: {
      complexName: true,
      periodDate: true,
      avgPricePerPyeong: true,
      avgPriceTotal: true,
      transactionCount: true,
    },
  });

  const byComplex = new Map<string, typeof rows>();
  for (const row of rows) {
    const existing = byComplex.get(row.complexName);
    if (existing) existing.push(row);
    else byComplex.set(row.complexName, [row]);
  }

  const complexes: TopComplex[] = [];
  for (const [complexName, history] of byComplex) {
    const latest = history[history.length - 1];
    if (latest.avgPricePerPyeong === null) continue;
    complexes.push({
      complexName,
      latestPeriodDate: latest.periodDate,
      latestAvgPricePerPyeong: latest.avgPricePerPyeong,
      latestAvgPriceTotal: latest.avgPriceTotal,
      latestTransactionCount: latest.transactionCount,
      trend: history.map((h) => ({
        periodDate: h.periodDate,
        avgPricePerPyeong: h.avgPricePerPyeong,
        transactionCount: h.transactionCount,
      })),
    });
  }

  complexes.sort(
    (a, b) => (b.latestAvgPricePerPyeong ?? 0) - (a.latestAvgPricePerPyeong ?? 0),
  );

  return complexes.slice(0, limit);
}
