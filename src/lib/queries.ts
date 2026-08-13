import { prisma } from "@/lib/db";
import { DISTRICTS, type DistrictConfig } from "@/lib/districts";
import { computeJobHousingIndex } from "@/lib/scoring/jobHousingIndex";
import { computeMobilityIndex } from "@/lib/scoring/mobilityIndex";
import {
  computeComplexJobProximity,
  computeDistrictJobDensity,
  computeValueScores,
} from "@/lib/scoring/complexScore";
import { getDistrictFreshness, type FreshnessInfo } from "@/lib/freshness";
import type { ComplexTradeRecord, NotableCompany } from "@/lib/adapters/types";
import { haversineM } from "@/lib/geo";

// Straight-line-distance heuristic, not a real routing estimate — no
// directions/routing API is wired up. ~20km/h approximates a mixed
// walk+transit+driving pace across these dense business districts.
const ESTIMATED_KMH = 20;

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
  priceGrowthRatio: number | null;
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
    priceGrowthRatio: r.growthRatio,
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
  transactionSource: string | null;
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
        select: { periodDate: true, avgPricePerPyeong: true, transactionCount: true, source: true },
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
    transactions: transactions.map(({ source: _source, ...t }) => t),
    transactionSource: transactions.length > 0 ? transactions[transactions.length - 1].source : null,
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
  /** "아파트" | "오피스텔" */
  propertyType: string;
  /** Construction year, from MOLIT's buildYear field — null on pre-migration cached rows. */
  buildYear: number | null;
  latestPeriodDate: Date;
  latestAvgPricePerPyeong: number | null;
  latestAvgPriceTotal: number | null;
  latestTransactionCount: number;
  trend: ComplexTransactionPoint[];
  recentTrades: ComplexTradeRecord[];
  lat: number | null;
  lng: number | null;
  nearestSubwayName: string | null;
  nearestSubwayDistanceM: number | null;
  distanceToDistrictM: number | null;
  estimatedMinutesToDistrict: number | null;
  /** 0-100: district job density (50%) + closeness to the district center (30%) + closeness to a subway station (20%). */
  jobProximityScore: number;
}

const RECENT_TRADES_LIMIT = 60;

function parseTradeRecords(raw: unknown): ComplexTradeRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (r): r is ComplexTradeRecord =>
      r !== null &&
      typeof r === "object" &&
      typeof (r as ComplexTradeRecord).dealDate === "string" &&
      typeof (r as ComplexTradeRecord).areaM2 === "number" &&
      typeof (r as ComplexTradeRecord).areaPyeong === "number" &&
      typeof (r as ComplexTradeRecord).priceTotal === "number",
  );
}

type ComplexHistoryRow = {
  complexName: string;
  propertyType: string;
  periodDate: Date;
  avgPricePerPyeong: number | null;
  avgPriceTotal: number | null;
  transactionCount: number;
  raw: unknown;
};

type ComplexSummary = Omit<
  TopComplex,
  | "lat"
  | "lng"
  | "nearestSubwayName"
  | "nearestSubwayDistanceM"
  | "distanceToDistrictM"
  | "estimatedMinutesToDistrict"
  | "jobProximityScore"
>;
type ComplexWithLocation = Omit<TopComplex, "jobProximityScore">;

async function fetchComplexHistoryRows(districtId: string): Promise<ComplexHistoryRow[]> {
  return prisma.complexTransactionSnapshot.findMany({
    where: { districtId },
    orderBy: { periodDate: "asc" },
    select: {
      complexName: true,
      propertyType: true,
      periodDate: true,
      avgPricePerPyeong: true,
      avgPriceTotal: true,
      transactionCount: true,
      raw: true,
    },
  });
}

/** Groups raw monthly rows into one summary per complex — unsorted, unfiltered by rank. */
function buildComplexSummaries(rows: ComplexHistoryRow[]): ComplexSummary[] {
  // Keyed by name+type — 아파트/오피스텔 sharing a name in the same district
  // is unlikely but shouldn't merge if it happens.
  const byComplex = new Map<string, ComplexHistoryRow[]>();
  for (const row of rows) {
    const key = `${row.complexName}::${row.propertyType}`;
    const existing = byComplex.get(key);
    if (existing) existing.push(row);
    else byComplex.set(key, [row]);
  }

  const complexes: ComplexSummary[] = [];
  for (const history of byComplex.values()) {
    const latest = history[history.length - 1];
    if (latest.avgPricePerPyeong === null) continue;

    const recentTrades = history
      .flatMap((h) => parseTradeRecords(h.raw))
      .sort((a, b) => b.dealDate.localeCompare(a.dealDate))
      .slice(0, RECENT_TRADES_LIMIT);

    complexes.push({
      complexName: latest.complexName,
      propertyType: latest.propertyType,
      buildYear: recentTrades.find((t) => t.buildYear != null)?.buildYear ?? null,
      latestPeriodDate: latest.periodDate,
      latestAvgPricePerPyeong: latest.avgPricePerPyeong,
      latestAvgPriceTotal: latest.avgPriceTotal,
      latestTransactionCount: latest.transactionCount,
      trend: history.map((h) => ({
        periodDate: h.periodDate,
        avgPricePerPyeong: h.avgPricePerPyeong,
        transactionCount: h.transactionCount,
      })),
      recentTrades,
    });
  }
  return complexes;
}

/**
 * Attaches coordinates + nearest subway (a plain cache read — resolved by
 * the update-complex-transactions cron, no Kakao calls here) and derives
 * distance/time to the district center from them.
 */
async function attachComplexLocations(
  districtId: string,
  district: DistrictConfig | undefined,
  list: ComplexSummary[],
): Promise<ComplexWithLocation[]> {
  if (list.length === 0) return [];

  const locations = await prisma.complexLocationCache.findMany({
    where: { districtId, complexName: { in: list.map((c) => c.complexName) } },
  });
  const locationByName = new Map(locations.map((l) => [l.complexName, l]));

  return list.map((c) => {
    const loc = locationByName.get(c.complexName);
    const lat = loc?.lat ?? null;
    const lng = loc?.lng ?? null;
    const distanceToDistrictM =
      lat !== null && lng !== null && district
        ? Math.round(haversineM({ lat, lng }, { lat: district.lat, lng: district.lng }))
        : null;

    return {
      ...c,
      lat,
      lng,
      nearestSubwayName: loc?.nearestSubwayName ?? null,
      nearestSubwayDistanceM: loc?.nearestSubwayDistanceM ?? null,
      distanceToDistrictM,
      estimatedMinutesToDistrict:
        distanceToDistrictM !== null
          ? Math.max(1, Math.round((distanceToDistrictM / 1000 / ESTIMATED_KMH) * 60))
          : null,
    };
  });
}

/**
 * District job density normalized across all 5 districts (same basis as the
 * district-level 직주근접 지수) — fetched fresh each call since it's just 5
 * cheap findFirst queries, and callers need it alongside per-district data
 * that's fetched in the same request anyway.
 */
async function getDistrictJobDensityMap(): Promise<Record<string, number>> {
  const companySnapshots = await Promise.all(
    DISTRICTS.map((d) =>
      prisma.companySnapshot.findFirst({
        where: { districtId: d.id },
        orderBy: { capturedAt: "desc" },
      }),
    ),
  );
  return computeDistrictJobDensity(
    DISTRICTS.map((d, i) => ({
      districtId: d.id,
      companyCount: companySnapshots[i]?.companyCount ?? 0,
      employeeCount: companySnapshots[i]?.employeeCount ?? null,
    })),
  );
}

function attachJobProximity(
  list: ComplexWithLocation[],
  districtId: string,
  jobDensityByDistrict: Record<string, number>,
): TopComplex[] {
  const districtJobDensityScore = jobDensityByDistrict[districtId] ?? 0;
  return list.map((c) => ({
    ...c,
    jobProximityScore: computeComplexJobProximity({
      districtJobDensityScore,
      distanceToDistrictM: c.distanceToDistrictM,
      nearestSubwayDistanceM: c.nearestSubwayDistanceM,
    }),
  }));
}

/**
 * Top N apartment complexes in a district by latest 실거래가 (평당가), each
 * with its recent trend for a mini chart. Prisma has no native "latest row
 * per group, then order by that value" query, so this fetches the full
 * per-complex history (bounded — a handful of complexes x 6 months per
 * district) and does the latest-per-complex + ranking in JS.
 *
 * 아파트만 대상으로 한다 — 오피스텔은 가격대가 달라 같은 평당가 순위에
 * 섞으면 왜곡되므로, 건물유형을 직접 고를 수 있는 추천 매물 찾기
 * (getRecommendedComplexes 계열)에서만 함께 다룬다.
 */
export async function getTopComplexesForDistrict(
  districtId: string,
  limit = 5,
): Promise<TopComplex[]> {
  const [rows, jobDensityByDistrict] = await Promise.all([
    fetchComplexHistoryRows(districtId),
    getDistrictJobDensityMap(),
  ]);
  const summaries = buildComplexSummaries(rows).filter((c) => c.propertyType === "아파트");
  summaries.sort((a, b) => (b.latestAvgPricePerPyeong ?? 0) - (a.latestAvgPricePerPyeong ?? 0));
  const top = summaries.slice(0, limit);

  const district = DISTRICTS.find((d) => d.id === districtId);
  const withLocation = await attachComplexLocations(districtId, district, top);
  return attachJobProximity(withLocation, districtId, jobDensityByDistrict);
}

export interface RecommendedComplex extends TopComplex {
  districtId: string;
  districtNameKo: string;
  /** 0-100 within the full candidate pool: cheaper 평당가 now scores higher. */
  affordabilityScore: number;
  /** 0-100 within the full candidate pool: grown less over the last 6 months scores higher ("hasn't caught up yet"). */
  undervaluationScore: number;
  /** jobProximityScore*0.4 + affordabilityScore*0.3 + undervaluationScore*0.3 */
  recommendScore: number;
  /** 2-3 short reasons this ranked well, strongest first, each grounded in an actual number rather than restating the score. */
  reasons: string[];
}

function buildRecommendReasons(c: {
  districtNameKo: string;
  jobProximityScore: number;
  affordabilityScore: number;
  undervaluationScore: number;
  nearestSubwayName: string | null;
  nearestSubwayDistanceM: number | null;
  distanceToDistrictM: number | null;
  latestAvgPricePerPyeong: number | null;
}): string[] {
  const proximityBits: string[] = [];
  if (c.nearestSubwayName && c.nearestSubwayDistanceM !== null) {
    proximityBits.push(`${c.nearestSubwayName}역 ${c.nearestSubwayDistanceM.toLocaleString()}m`);
  }
  if (c.distanceToDistrictM !== null) {
    proximityBits.push(`${c.districtNameKo}업무지구 ${(c.distanceToDistrictM / 1000).toFixed(1)}km`);
  }

  const priceText = c.latestAvgPricePerPyeong ? `${c.latestAvgPricePerPyeong.toLocaleString()}만원` : "가격 정보 없음";

  const candidates = [
    {
      score: c.jobProximityScore,
      text:
        c.jobProximityScore >= 60
          ? `직주근접 ${c.jobProximityScore}점으로 상위권${proximityBits.length ? ` — ${proximityBits.join(" · ")}` : ""}`
          : `직주근접 ${c.jobProximityScore}점${proximityBits.length ? ` (${proximityBits.join(" · ")})` : ""}`,
    },
    {
      score: c.affordabilityScore,
      text:
        c.affordabilityScore >= 60
          ? `같은 후보군 중 평당가가 저렴한 편 (${priceText})`
          : `평당가 ${priceText}, 후보군 중 평균 수준`,
    },
    {
      score: c.undervaluationScore,
      text:
        c.undervaluationScore >= 60
          ? "최근 6개월 상승률이 낮아 아직 저평가 구간으로 보임"
          : "최근 6개월 상승률은 후보군 중 평균 수준",
    },
  ];

  return candidates.sort((a, b) => b.score - a.score).map((r) => r.text);
}

/**
 * Same scoring as getRecommendedComplexes but restricted to one district's
 * own complexes — affordability/undervaluation are computed relative to
 * that district's candidate pool only, so "저평가" here means "cheap for
 * this district," not "cheap across all 5." Powers the per-district 추천
 *매물 finder embedded in the district detail page.
 */
export async function getDistrictRecommendedComplexes(
  districtId: string,
): Promise<RecommendedComplex[]> {
  const district = DISTRICTS.find((d) => d.id === districtId);
  if (!district) return [];

  const [rows, jobDensityByDistrict] = await Promise.all([
    fetchComplexHistoryRows(districtId),
    getDistrictJobDensityMap(),
  ]);
  const summaries = buildComplexSummaries(rows);
  const withLocation = await attachComplexLocations(districtId, district, summaries);
  const withJobProximity = attachJobProximity(withLocation, districtId, jobDensityByDistrict);
  if (withJobProximity.length === 0) return [];

  const { affordability, undervaluation } = computeValueScores(
    withJobProximity.map((c) => ({
      latestAvgPricePerPyeong: c.latestAvgPricePerPyeong ?? 0,
      priceGrowthRatio: priceGrowthRatio(c.trend),
    })),
  );

  return withJobProximity
    .map((c, i) => {
      const affordabilityScore = Math.round(affordability[i]);
      const undervaluationScore = Math.round(undervaluation[i]);
      const recommendScore = Math.round(
        c.jobProximityScore * 0.4 + affordabilityScore * 0.3 + undervaluationScore * 0.3,
      );
      const reasons = buildRecommendReasons({
        districtNameKo: district.nameKo,
        jobProximityScore: c.jobProximityScore,
        affordabilityScore,
        undervaluationScore,
        nearestSubwayName: c.nearestSubwayName,
        nearestSubwayDistanceM: c.nearestSubwayDistanceM,
        distanceToDistrictM: c.distanceToDistrictM,
        latestAvgPricePerPyeong: c.latestAvgPricePerPyeong,
      });
      return {
        ...c,
        districtId,
        districtNameKo: district.nameKo,
        affordabilityScore,
        undervaluationScore,
        recommendScore,
        reasons,
      };
    })
    .sort((a, b) => b.recommendScore - a.recommendScore);
}

/**
 * Every apartment complex across all 5 districts (not just each district's
 * priciest — the point here is to surface good-value ones, which the
 * price-ranked TOP5 would systematically exclude), scored and sorted for
 * the 추천 매물 finder. Scores are computed once over the full pool server
 * side; the UI filters/slices client side rather than re-querying.
 */
export async function getRecommendedComplexes(): Promise<RecommendedComplex[]> {
  const jobDensityByDistrict = await getDistrictJobDensityMap();

  const perDistrict = await Promise.all(
    DISTRICTS.map(async (district) => {
      const rows = await fetchComplexHistoryRows(district.id);
      const summaries = buildComplexSummaries(rows);
      const withLocation = await attachComplexLocations(district.id, district, summaries);
      const withJobProximity = attachJobProximity(withLocation, district.id, jobDensityByDistrict);
      return withJobProximity.map((c) => ({
        ...c,
        districtId: district.id,
        districtNameKo: district.nameKo,
      }));
    }),
  );

  const all = perDistrict.flat();
  if (all.length === 0) return [];

  const { affordability, undervaluation } = computeValueScores(
    all.map((c) => ({
      latestAvgPricePerPyeong: c.latestAvgPricePerPyeong ?? 0,
      priceGrowthRatio: priceGrowthRatio(c.trend),
    })),
  );

  return all
    .map((c, i) => {
      const affordabilityScore = Math.round(affordability[i]);
      const undervaluationScore = Math.round(undervaluation[i]);
      const recommendScore = Math.round(
        c.jobProximityScore * 0.4 + affordabilityScore * 0.3 + undervaluationScore * 0.3,
      );
      const reasons = buildRecommendReasons({
        districtNameKo: c.districtNameKo,
        jobProximityScore: c.jobProximityScore,
        affordabilityScore,
        undervaluationScore,
        nearestSubwayName: c.nearestSubwayName,
        nearestSubwayDistanceM: c.nearestSubwayDistanceM,
        distanceToDistrictM: c.distanceToDistrictM,
        latestAvgPricePerPyeong: c.latestAvgPricePerPyeong,
      });
      return { ...c, affordabilityScore, undervaluationScore, recommendScore, reasons };
    })
    .sort((a, b) => b.recommendScore - a.recommendScore);
}
