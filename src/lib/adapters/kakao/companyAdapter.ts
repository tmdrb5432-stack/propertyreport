import type { DistrictConfig } from "@/lib/districts";
import type {
  CompanySnapshotInput,
  DataSourceAdapter,
  NotableCompany,
} from "@/lib/adapters/types";
import { searchKeyword, type KakaoDocument } from "./client";

// Kakao Local API has no "company/office" category group code, so we approximate
// company presence with a curated set of keyword searches and de-dupe by place id.
const COMPANY_QUERIES = ["기업", "본사", "오피스"];
const NOTABLE_COMPANY_LIMIT = 10;

function toNotableCompany(doc: KakaoDocument): NotableCompany {
  return {
    name: doc.place_name,
    category: doc.category_name,
    address: doc.road_address_name || doc.address_name,
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
        if (!seen.has(doc.id)) seen.set(doc.id, doc);
      }
    }

    const uniqueDocs = [...seen.values()].sort(
      (a, b) => Number(a.distance || 0) - Number(b.distance || 0),
    );

    return {
      // Bounded by Kakao's ~45-results-per-query cap x number of queries — an
      // approximation of company presence, not an exhaustive business census.
      companyCount: uniqueDocs.length,
      // Kakao Local API does not expose employee counts; left null and shown
      // as an estimate/unavailable in the UI rather than fabricated.
      employeeCount: null,
      notableCompanies: uniqueDocs
        .slice(0, NOTABLE_COMPANY_LIMIT)
        .map(toNotableCompany),
      raw: uniqueDocs,
    };
  }
}

export const kakaoCompanyAdapter = new KakaoCompanyAdapter();
