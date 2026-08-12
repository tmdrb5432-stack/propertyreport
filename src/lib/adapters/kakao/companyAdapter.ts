import type { DistrictConfig } from "@/lib/districts";
import type {
  CompanySnapshotInput,
  DataSourceAdapter,
  NotableCompany,
} from "@/lib/adapters/types";
import { searchKeyword, type KakaoDocument } from "./client";
import { loadCorpNameIndex, matchCompany } from "@/lib/dart/matchCompany";
import { getCachedEmployeeCount } from "@/lib/dart/employeeApi";
import { estimateEmployeeCount } from "@/lib/companySize";

// Kakao Local API has no "company/office" category group code, so we approximate
// company presence with a curated set of keyword searches and de-dupe by place id.
const COMPANY_QUERIES = ["기업", "본사", "오피스"];
const NOTABLE_COMPANY_LIMIT = 10;

// Keyword search for "기업"/"본사"/"오피스" pulls in obvious false positives —
// convenience stores, parking lots, restaurants near an office building, etc.
// whose name or listing happens to match. category_group_code is Kakao's
// closest thing to a type filter; exclude the categories that are clearly
// never a company/employer even though they have no dedicated "office" code.
const EXCLUDED_CATEGORY_GROUP_CODES = new Set([
  "CS2", // 편의점
  "PK6", // 주차장
  "MT1", // 대형마트
  "FD6", // 음식점
  "CE7", // 카페
  "HP8", // 병원
  "PM9", // 약국
  "OL7", // 주유소,충전소
  "SW8", // 지하철역
  "AT4", // 관광명소
  "AD5", // 숙박
  "CT1", // 문화시설
  "PS3", // 어린이집,유치원
  "SC4", // 학교
  "AC5", // 학원
]);

async function resolveEmployeeCount(
  doc: KakaoDocument,
  corpNameIndex: Awaited<ReturnType<typeof loadCorpNameIndex>>,
): Promise<{ employeeCount: number | null; source: "dart" | "estimate" }> {
  const corpCode = matchCompany(doc.place_name, corpNameIndex);
  if (corpCode) {
    try {
      const real = await getCachedEmployeeCount(corpCode);
      if (real !== null) return { employeeCount: real, source: "dart" };
    } catch {
      // DART lookup failed for this company (e.g. key missing/rate limited) —
      // fall through to the estimate rather than failing the whole district.
    }
  }
  return {
    employeeCount: estimateEmployeeCount(doc.id, doc.place_name, doc.category_name),
    source: "estimate",
  };
}

export class KakaoCompanyAdapter
  implements DataSourceAdapter<CompanySnapshotInput>
{
  readonly sourceName = "kakao";
  readonly cadence = "daily" as const;

  async fetch(district: DistrictConfig): Promise<CompanySnapshotInput> {
    const resultsByQuery = await Promise.all(
      COMPANY_QUERIES.map((query) =>
        searchKeyword({
          query,
          x: district.lng,
          y: district.lat,
          radius: district.radiusM,
        }),
      ),
    );

    const seen = new Map<string, KakaoDocument>();
    for (const docs of resultsByQuery) {
      for (const doc of docs) {
        if (EXCLUDED_CATEGORY_GROUP_CODES.has(doc.category_group_code)) continue;
        if (!seen.has(doc.id)) seen.set(doc.id, doc);
      }
    }

    const uniqueDocs = [...seen.values()].sort(
      (a, b) => Number(a.distance || 0) - Number(b.distance || 0),
    );

    // Loaded once per district (not once per company) — the corp name index
    // is small (listed companies only) and reused across every doc below.
    const corpNameIndex = await loadCorpNameIndex();

    const resolved = await Promise.all(
      uniqueDocs.map(async (doc) => {
        const { employeeCount, source } = await resolveEmployeeCount(doc, corpNameIndex);
        const company: NotableCompany = {
          name: doc.place_name,
          category: doc.category_name,
          address: doc.road_address_name || doc.address_name,
          employeeCount,
          employeeCountSource: source,
          lat: doc.y ? Number(doc.y) : null,
          lng: doc.x ? Number(doc.x) : null,
        };
        return company;
      }),
    );

    // 주요회사는 종사자수(실데이터 우선, 없으면 추정치) 기준 내림차순.
    const rankedBySize = [...resolved].sort(
      (a, b) => (b.employeeCount ?? 0) - (a.employeeCount ?? 0),
    );

    const totalEmployeeEstimate = resolved.reduce(
      (sum, c) => sum + (c.employeeCount ?? 0),
      0,
    );

    return {
      // Bounded by Kakao's ~45-results-per-query cap x number of queries — an
      // approximation of company presence, not an exhaustive business census.
      companyCount: uniqueDocs.length,
      // Aggregate of each company's real (DART) or estimated employee count —
      // shown in the UI as an estimate since most entries are heuristic.
      employeeCount: uniqueDocs.length > 0 ? totalEmployeeEstimate : null,
      notableCompanies: rankedBySize.slice(0, NOTABLE_COMPANY_LIMIT),
      raw: uniqueDocs,
    };
  }
}

export const kakaoCompanyAdapter = new KakaoCompanyAdapter();
